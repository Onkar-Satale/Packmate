import os
import re
import logging
import requests
from groq import Groq
from fastapi import HTTPException
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Define paths and load .env configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(os.path.dirname(BASE_DIR), ".env")
load_dotenv(dotenv_path=ENV_PATH)

CHROMA_DB_DIR = os.path.join(BASE_DIR, "chroma_db")

# Global ChromaDB client & collection cache to avoid connection overhead on every query
_chroma_client = None
_collection = None

def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        try:
            import chromadb
            if os.path.exists(CHROMA_DB_DIR):
                logger.info("Initializing global ChromaDB persistent client...")
                _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
                try:
                    _collection = _chroma_client.get_collection(name="travel_assistant")
                except Exception:
                    logger.warning("travel_assistant collection does not exist in ChromaDB yet.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB collection: {e}")
    return _collection

# Load HuggingFace model globally only if explicitly requested (e.g. for offline local development/ingest)
USE_LOCAL_EMBEDDINGS = os.getenv("USE_LOCAL_EMBEDDINGS", "true").lower() == "true"

_embedding_model = None
if USE_LOCAL_EMBEDDINGS:
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Initializing local SentenceTransformer embedding model 'all-MiniLM-L6-v2'...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    except ImportError:
        logger.error("SentenceTransformer package is not installed. Local RAG embeddings will be unavailable.")
    except Exception as e:
        logger.error(f"Error loading local SentenceTransformer: {e}")
else:
    logger.info("USE_LOCAL_EMBEDDINGS is false. Local SentenceTransformer will not be loaded (using Hugging Face API instead).")

def get_embedding_model():
    return _embedding_model

def query_huggingface_embeddings(texts: list) -> list:
    """
    Query Hugging Face Inference API for text embeddings using all-MiniLM-L6-v2.
    """
    model_id = "sentence-transformers/all-MiniLM-L6-v2"
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_id}"
    
    # Optional HF_TOKEN environment variable for higher limits
    hf_token = os.getenv("HF_TOKEN")
    headers = {}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
        
    payload = {
        "inputs": texts,
        "options": {"wait_for_model": True}
    }
    
    response = requests.post(api_url, headers=headers, json=payload, timeout=15)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Hugging Face API returned status {response.status_code}: {response.text}")

def embed_documents(texts: list) -> list:
    """
    Generates embeddings for a list of document chunks.
    """
    model = get_embedding_model()
    if model:
        embeddings = model.encode(texts, show_progress_bar=False)
        return [embedding.tolist() for embedding in embeddings]
    else:
        logger.info("Using Hugging Face Inference API for document embeddings...")
        return query_huggingface_embeddings(texts)

def embed_query(query: str) -> list:
    """
    Generates an embedding for a single user query string.
    """
    model = get_embedding_model()
    if model:
        embedding = model.encode(query, show_progress_bar=False)
        return embedding.tolist()
    else:
        logger.info("Using Hugging Face Inference API for query embedding...")
        res = query_huggingface_embeddings([query])
        if isinstance(res, list) and len(res) > 0:
            return res[0]
        raise ValueError(f"Unexpected response format from Hugging Face API: {res}")

def retrieve_relevant_chunks(query_text: str, n_results: int = 7) -> dict:
    """
    Generates embedding for the query and retrieves matched document chunks from ChromaDB.
    """
    try:
        collection = get_collection()
        if collection is None:
            logger.warning("ChromaDB collection is not available.")
            return {}
            
        # 1. Embed query using our custom model
        query_embedding = embed_query(query_text)
        
        # 2. Query collection with embedding
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        return results
    except Exception as e:
        logger.error(f"Error in retrieve_relevant_chunks: {e}")
        return {}

def build_rag_prompt(query: str, chunks: list, metadatas: list) -> tuple:
    """
    Assembles a context-enriched system prompt.
    """
    context_str = ""
    sources = set()
    
    if chunks:
        for idx, (doc, meta) in enumerate(zip(chunks, metadatas)):
            source_file = meta.get("source", "Unknown Document") if meta else "Unknown Document"
            sources.add(source_file)
            context_str += f"\n--- Context Chunk {idx+1} (Source: {source_file}) ---\n{doc}\n"
            
    sources_str = ", ".join(sources) if sources else "None"
    
    prompt = f"""
You are a highly helpful and accurate Travel Assistant for PackMate.
You must answer the traveler's question using ONLY the provided context retrieved from our travel guides and knowledge base PDFs.
If the answer to the traveler's question cannot be found or inferred from the provided context chunks below, you must state exactly:
"I'm sorry, I could not find relevant information in the knowledge base to answer your question."
Do not attempt to answer using external knowledge or make up facts (hallucinate).
When you provide the answer, mention the document sources used (e.g., "Source: {sources_str}") in your response.

Provided Context:
{context_str}

Traveler's Question:
{query}

Your Answer:
"""
    return prompt, list(sources)

def generate_rag_response(prompt: str) -> str:
    """
    Calls Groq API to generate response based on prompt.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY could not be loaded from environment.")
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
        
    client = Groq(api_key=api_key)
    model_name = "llama-3.1-8b-instant"
    fallback_model = "llama-3.3-70b-versatile"
    
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"Failed to query {model_name} in RAG. Falling back to {fallback_model}. Error: {e}")
        try:
            response = client.chat.completions.create(
                model=fallback_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            return response.choices[0].message.content
        except Exception as e2:
            logger.error(f"Groq completions failed in RAG pipeline: {e2}")
            raise HTTPException(status_code=500, detail="Failed to query completions model from Groq.")

def travel_chatbot(query: str) -> dict:
    """
    Full pipeline entry point coordinating retrieval, prompt building, and response generation,
    with an automatic general knowledge fallback.
    """
    refusal_phrase = "I'm sorry, I could not find relevant information in the knowledge base to answer your question."
    
    # 1. Retrieve most similar chunks
    results = retrieve_relevant_chunks(query, n_results=7)
    chunks = results.get("documents", [[]])[0] if results.get("documents") else []
    metadatas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
    
    if chunks:
        # 2. Compile RAG prompt
        prompt, sources = build_rag_prompt(query, chunks, metadatas)
        # 3. Generate RAG completions
        answer = generate_rag_response(prompt)
        
        # Check if RAG refused to answer (context missing information)
        if refusal_phrase.lower() not in answer.lower():
            return {
                "answer": answer.strip(),
                "sources": sources,
                "is_fallback": False
            }
            
    # 4. Fallback: Generate response using general knowledge
    logger.info(f"RAG search failed to resolve query: '{query}'. Falling back to General LLM completions.")
    fallback_prompt = f"""
You are a highly helpful and accurate Travel Assistant for PackMate.
Answer the traveler's question using your general pre-trained knowledge.
Keep your answer clear, concise, structured, and helpful.

Traveler's Question:
{query}

Your Answer:
"""
    fallback_answer = generate_rag_response(fallback_prompt)
    return {
        "answer": fallback_answer.strip(),
        "sources": [],
        "is_fallback": True
    }
