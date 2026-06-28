import os
import glob
import json
import logging
from pypdf import PdfReader

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDFS_DIR = os.path.join(BASE_DIR, "pdfs")
CHROMA_DB_DIR = os.path.join(BASE_DIR, "chroma_db")
MANIFEST_PATH = os.path.join(BASE_DIR, "ingest_manifest.json")

def load_manifest() -> dict:
    """
    Loads the ingestion manifest from disk if it exists.
    """
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading manifest: {e}")
    return {"processed_files": {}}

def save_manifest(manifest: dict):
    """
    Saves the ingestion manifest to disk.
    """
    try:
        with open(MANIFEST_PATH, "w") as f:
            json.dump(manifest, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving manifest: {e}")

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts plain text from all pages of a PDF document.
    """
    logger.info(f"Extracting text from PDF: {pdf_path}")
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading PDF {pdf_path}: {e}")
        return ""

def split_text_into_chunks(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list:
    """
    Splits document text into chunks of specified characters, overlapping to retain context.
    Splits at word boundaries (whitespace).
    """
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    # Estimate average word length is 6 chars, so 200 chars overlap is ~30 words
    overlap_word_count = 30
    
    for word in words:
        current_chunk.append(word)
        current_length += len(word) + 1 # +1 for space
        if current_length >= chunk_size:
            chunks.append(" ".join(current_chunk))
            # Keep overlap words for the next chunk
            overlap_words = current_chunk[-overlap_word_count:] if len(current_chunk) > overlap_word_count else current_chunk
            current_chunk = list(overlap_words)
            current_length = sum(len(w) + 1 for w in current_chunk)
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return [c for c in chunks if c.strip()]

def ingest_pdfs():
    """
    Scans the pdfs directory, processes new or modified files, 
    deletes records of deleted files, and persists embeddings to ChromaDB.
    """
    # Ensure directories exist
    os.makedirs(PDFS_DIR, exist_ok=True)
    os.makedirs(CHROMA_DB_DIR, exist_ok=True)

    manifest = load_manifest()
    processed_files = manifest.setdefault("processed_files", {})
    
    # Scan PDFs on disk
    pdf_paths = glob.glob(os.path.join(PDFS_DIR, "*.pdf"))
    current_files = {}
    for p in pdf_paths:
        filename = os.path.basename(p)
        current_files[filename] = {
            "path": p,
            "mtime": os.path.getmtime(p)
        }

    # Import chromadb locally so that we only initialize it when needed
    import chromadb
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # Reset collection to prevent stale or duplicate entries if starting fresh
    if not processed_files:
        try:
            client.delete_collection(name="travel_assistant")
            logger.info("Purged old 'travel_assistant' collection to prevent stale/duplicate entries.")
        except Exception as e:
            logger.debug(f"No collection to purge: {e}")

    collection = client.get_or_create_collection(name="travel_assistant")

    # 1. Identify files to add or reprocess
    reprocessed_any = False
    for filename, info in current_files.items():
        saved_info = processed_files.get(filename)
        # Skip if already processed and unmodified
        if saved_info and saved_info.get("mtime") == info["mtime"]:
            continue
            
        logger.info(f"New or modified file detected: {filename}")
        
        # If it was processed before, delete old entries from ChromaDB
        if saved_info:
            logger.info(f"Removing old vector database records for: {filename}")
            try:
                collection.delete(where={"source": filename})
            except Exception as e:
                logger.warning(f"Failed to delete old records for {filename}: {e}")

        # Extract text & Chunk
        text = extract_text_from_pdf(info["path"])
        if not text.strip():
            logger.warning(f"No text extracted from {filename}. Skipping.")
            continue
            
        chunks = split_text_into_chunks(text)
        logger.info(f"Split {filename} into {len(chunks)} chunks.")
        
        if chunks:
            # Prepare data for ChromaDB
            ids = [f"{filename}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]
            
            # Load into Chroma DB using our custom SentenceTransformer embeddings model
            try:
                try:
                    from knowledge_base.rag import embed_documents
                except ModuleNotFoundError:
                    from rag import embed_documents
                embeddings = embed_documents(chunks)
                collection.add(
                    documents=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
                logger.info(f"Ingested {len(chunks)} custom embedded vector records for: {filename}")
                processed_files[filename] = {
                    "mtime": info["mtime"],
                    "chunk_count": len(chunks)
                }
                reprocessed_any = True
            except Exception as e:
                logger.error(f"Error loading vectors into ChromaDB for {filename}: {e}")

    # 2. Identify deleted files (in manifest but no longer on disk)
    deleted_files = []
    for filename in list(processed_files.keys()):
        if filename not in current_files:
            logger.info(f"File deleted from disk: {filename}")
            try:
                collection.delete(where={"source": filename})
                logger.info(f"Deleted vector database records for: {filename}")
            except Exception as e:
                logger.warning(f"Failed to delete records for deleted file {filename}: {e}")
            deleted_files.append(filename)
            reprocessed_any = True

    for filename in deleted_files:
        processed_files.pop(filename, None)

    # 3. Save updated manifest
    if reprocessed_any:
        save_manifest(manifest)
        logger.info("Ingestion manifest updated successfully.")
    else:
        logger.info("No modifications detected. Vector database is up to date.")

def main():
    logger.info("Starting Travel Assistant Knowledge Ingestion...")
    try:
        ingest_pdfs()
    except Exception as e:
        logger.error(f"Error during RAG indexing pipeline execution: {e}")

if __name__ == "__main__":
    main()
