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

# Define paths and load .env configuration relative to project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)

CHROMA_DB_DIR = os.path.join(BASE_DIR, "app", "knowledge_base", "chroma_db")

import threading

# Global ChromaDB client & collection cache to avoid connection overhead on every query
_chroma_client = None
_collection = None
_init_lock = threading.Lock()

def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        with _init_lock:
            if _collection is None:
                try:
                    import chromadb
                    # Ensure path directory exists
                    os.makedirs(CHROMA_DB_DIR, exist_ok=True)
                    logger.info(f"Initializing global ChromaDB persistent client at: {CHROMA_DB_DIR}")
                    _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
                    try:
                        # Try to get or create collection with cosine similarity metric
                        _collection = _chroma_client.get_or_create_collection(
                            name="travel_assistant",
                            metadata={"hnsw:space": "cosine"}
                        )
                        logger.info("ChromaDB collection 'travel_assistant' initialized successfully with Cosine space.")
                    except Exception as e:
                        logger.warning(f"Failed to get/create collection with cosine metadata: {e}. Falling back to default.")
                        _collection = _chroma_client.get_collection(name="travel_assistant")
                except Exception as e:
                    logger.error(f"Failed to initialize ChromaDB collection: {e}")
    return _collection

# Check if we are running on Render or locally
ON_RENDER = os.getenv("RENDER", "false").lower() == "true"

# Default to local embeddings locally, but use Hugging Face API on Render to stay within 512MB RAM limit
USE_LOCAL_EMBEDDINGS_DEFAULT = "false" if ON_RENDER else "true"
USE_LOCAL_EMBEDDINGS = os.getenv("USE_LOCAL_EMBEDDINGS", USE_LOCAL_EMBEDDINGS_DEFAULT).lower() == "true"

_embedding_model = None
_model_lock = threading.Lock()

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None and USE_LOCAL_EMBEDDINGS:
        with _model_lock:
            if _embedding_model is None:
                try:
                    # Optimize PyTorch CPU usage for container environments (avoid thread contention)
                    import torch
                    torch.set_num_threads(1)
                    logger.info("Set PyTorch CPU threads to 1 for optimal container performance.")
                except Exception as e:
                    logger.debug(f"Failed to optimize PyTorch CPU threads: {e}")
                try:
                    from sentence_transformers import SentenceTransformer
                    logger.info("Initializing local SentenceTransformer embedding model 'all-MiniLM-L6-v2'...")
                    _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
                    logger.info("Local SentenceTransformer embedding model initialized successfully.")
                except ImportError:
                    logger.error("SentenceTransformer package is not installed. Local RAG embeddings will be unavailable.")
                except Exception as e:
                    logger.error(f"Error loading local SentenceTransformer: {e}")
    return _embedding_model

def query_huggingface_embeddings(texts: list) -> list:
    """
    Query Hugging Face Inference API for text embeddings using all-MiniLM-L6-v2 via requests.
    This bypasses the InferenceClient provider permissions issue and supports batching.
    """
    model_id = "sentence-transformers/all-MiniLM-L6-v2"
    api_url = f"https://router.huggingface.co/hf-inference/models/{model_id}"
    
    hf_token = os.getenv("HF_TOKEN")
    headers = {}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
        
    logger.info(f"Querying Hugging Face Inference API for {len(texts)} texts...")
    
    import time
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = requests.post(api_url, headers=headers, json={"inputs": texts}, timeout=20)
            
            # Check for model loading (503 Service Unavailable / estimated_time in JSON)
            if response.status_code == 503:
                try:
                    res_json = response.json()
                    if isinstance(res_json, dict) and "estimated_time" in res_json:
                        wait_time = min(res_json["estimated_time"], 10)
                        logger.warning(f"Hugging Face model is loading. Waiting {wait_time}s (attempt {attempt+1}/{max_retries})...")
                        time.sleep(wait_time)
                        continue
                except Exception:
                    pass
                time.sleep(5)
                continue
                
            response.raise_for_status()
            embeddings = response.json()
            
            # The expected output for sentence-transformers is a 2D list: [[float, ...], [float, ...]]
            if isinstance(embeddings, list) and len(embeddings) > 0:
                first = embeddings[0]
                if isinstance(first, list) and len(first) > 0:
                    # Check if it's a 3D list (sequence embeddings instead of pooled embeddings)
                    if isinstance(first[0], list):
                        logger.warning("Hugging Face API returned sequence-level embeddings. Performing mean pooling...")
                        pooled_embeddings = []
                        for seq in embeddings:
                            num_tokens = len(seq)
                            if num_tokens == 0:
                                pooled_embeddings.append([0.0] * 384)
                                continue
                            dim = len(seq[0])
                            mean_emb = [0.0] * dim
                            for token_emb in seq:
                                for idx, val in enumerate(token_emb):
                                    mean_emb[idx] += val
                            mean_emb = [val / num_tokens for val in mean_emb]
                            pooled_embeddings.append(mean_emb)
                        return pooled_embeddings
                    else:
                        # It is a 2D list, which is the correct format
                        return embeddings
                        
            raise ValueError(f"Unexpected response format from Hugging Face API: {embeddings}")
            
        except Exception as e:
            logger.error(f"Attempt {attempt+1} failed querying Hugging Face API: {e}")
            if attempt == max_retries - 1:
                raise e
            time.sleep(3)

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

def retrieve_relevant_chunks(query_text: str, n_results: int = 4) -> dict:
    """
    Generates embedding for the query and retrieves matched document chunks from ChromaDB.
    """
    try:
        collection = get_collection()
        if collection is None:
            logger.warning("ChromaDB collection is not available.")
            return {}
            
        # 1. Embed query using our custom model
        logger.info(f"Generating query embedding for: '{query_text}'")
        query_embedding = embed_query(query_text)
        
        # 2. Query collection with embedding
        logger.info(f"Querying ChromaDB collection 'travel_assistant' for {n_results} nearest neighbors...")
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
    with an automatic general knowledge fallback when no relevant PDF context exists.
    """
    logger.info(f"--- Processing query in travel_chatbot: '{query}' ---")
    
    # 1. Retrieve most similar chunks
    results = retrieve_relevant_chunks(query, n_results=4)
    
    raw_documents = results.get("documents", [[]])[0] if results.get("documents") else []
    raw_metadatas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
    raw_distances = results.get("distances", [[]])[0] if results.get("distances") else []
    
    # Safely get space setting from collection metadata
    collection = get_collection()
    space = "l2"
    if collection and collection.metadata:
        space = collection.metadata.get("hnsw:space", "l2")
        
    # Get distance threshold from environment or space default
    default_threshold = 0.5 if space == "cosine" else 1.0
    threshold_env = os.getenv("RAG_DISTANCE_THRESHOLD")
    distance_threshold = float(threshold_env) if threshold_env else default_threshold
    
    logger.info(f"Retrieval configurations: space={space}, threshold={distance_threshold}")
    
    filtered_chunks = []
    filtered_metadatas = []
    
    logger.info(f"Retrieved {len(raw_documents)} raw chunks from database:")
    for idx in range(len(raw_documents)):
        doc = raw_documents[idx]
        meta = raw_metadatas[idx] if idx < len(raw_metadatas) else {}
        dist = raw_distances[idx] if idx < len(raw_distances) else distance_threshold
        
        # Calculate similarity score percentage
        if space == "cosine":
            similarity = 1.0 - dist
        else:  # l2 space
            similarity = 1.0 - (dist / 2.0)
        similarity_percentage = max(0.0, min(1.0, similarity)) * 100
        
        passed = dist <= distance_threshold
        source = meta.get("source", "Unknown Document")
        preview = doc.replace("\n", " ")[:80]
        
        logger.info(
            f"  [{idx+1}] Source: {source} | Distance: {dist:.4f} | "
            f"Similarity: {similarity_percentage:.1f}% | Passed: {passed} | Preview: '{preview}...'"
        )
        
        if passed:
            filtered_chunks.append(doc)
            filtered_metadatas.append(meta)
            
    # Refusal phrase configured in the prompt instructions
    refusal_phrase = "I'm sorry, I could not find relevant information in the knowledge base to answer your question."
    
    # 2. Decision logic: Proceed with RAG or fallback to general LLM
    if not filtered_chunks:
        logger.info(f"Decision: No relevant PDF chunks passed the threshold. Falling back to General LLM knowledge.")
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
        
    logger.info(f"Decision: {len(filtered_chunks)} relevant chunk(s) passed the threshold. Querying RAG LLM.")
    
    # 3. Compile RAG prompt
    prompt, sources = build_rag_prompt(query, filtered_chunks, filtered_metadatas)
    
    # 4. Generate RAG completions
    answer = generate_rag_response(prompt)
    
    # Robust check for refusal: check for standard variations of the refusal phrase
    refusal_checks = [
        refusal_phrase.lower(),
        "could not find relevant information in the knowledge base",
        "i could not find any information in the provided context",
        "the provided context does not contain",
        "i'm sorry, but i cannot answer",
        "the context provided does not mention",
        "based on the context provided, there is no"
    ]
    
    lowered_answer = answer.lower()
    model_refused = any(ref_phrase in lowered_answer for ref_phrase in refusal_checks)
    
    if model_refused:
        logger.info("RAG LLM indicated it could not find the answer in the provided PDF context.")
        # Ensure we return a clean refusal without using fallback to general knowledge
        return {
            "answer": answer.strip(),
            "sources": sources,
            "is_fallback": False
        }
        
    logger.info("RAG LLM successfully generated an answer based on PDF context.")
    return {
        "answer": answer.strip(),
        "sources": sources,
        "is_fallback": False
    }
