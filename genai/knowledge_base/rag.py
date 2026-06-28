import os
import logging
from sentence_transformers import SentenceTransformer
from groq import Groq
from fastapi import HTTPException

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DB_DIR = os.path.join(BASE_DIR, "chroma_db")

# Load HuggingFace model globally for embeddings to keep it ready in memory
try:
    logger.info("Initializing SentenceTransformer embedding model 'all-MiniLM-L6-v2'...")
    _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    logger.error(f"Error loading SentenceTransformer: {e}")
    _embedding_model = None

def get_embedding_model():
    return _embedding_model

def embed_documents(texts: list) -> list:
    """
    Generates embeddings for a list of document chunks.
    """
    model = get_embedding_model()
    if not model:
        raise ValueError("Embedding model is not initialized.")
    embeddings = model.encode(texts, show_progress_bar=False)
    # Convert numpy array output to standard Python float list list
    return [embedding.tolist() for embedding in embeddings]

def embed_query(query: str) -> list:
    """
    Generates an embedding for a single user query string.
    """
    model = get_embedding_model()
    if not model:
        raise ValueError("Embedding model is not initialized.")
    embedding = model.encode(query, show_progress_bar=False)
    return embedding.tolist()

def retrieve_relevant_chunks(query_text: str, n_results: int = 3) -> dict:
    """
    Generates embedding for the query and retrieves matched document chunks from ChromaDB.
    """
    try:
        import chromadb
        if not os.path.exists(CHROMA_DB_DIR):
            logger.warning(f"ChromaDB directory does not exist at {CHROMA_DB_DIR}")
            return {}
            
        client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        try:
            collection = client.get_collection(name="travel_assistant")
        except Exception:
            logger.warning("travel_assistant collection does not exist in ChromaDB yet.")
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
    # Import key locally to avoid circular dependencies
    try:
        from main import GROQ_API_KEY
    except ModuleNotFoundError:
        import sys
        sys.path.append(os.path.dirname(BASE_DIR))
        from main import GROQ_API_KEY
    client = Groq(api_key=GROQ_API_KEY)
    model_name = "llama-3.3-70b-versatile"
    fallback_model = "llama-3.1-8b-instant"
    
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
    results = retrieve_relevant_chunks(query, n_results=3)
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
