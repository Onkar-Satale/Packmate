import os
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import verify_api_key
from app.schemas.schemas import ChatRequest
from app.config.settings import logger

router = APIRouter()

@router.post("/chat", dependencies=[Depends(verify_api_key)])
def api_chat(req: ChatRequest):
    """
    RAG-based Chatbot endpoint that accepts user questions,
    retrieves context from vector store, queries LLM, and returns the response.
    """
    try:
        from app.services.rag import travel_chatbot
        return travel_chatbot(req.message)
    except Exception as e:
        logger.error(f"Error in api_chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/travel-chat", dependencies=[Depends(verify_api_key)])
def api_travel_chat(req: ChatRequest):
    """
    RAG-based Travel Chatbot endpoint that queries the vector database
    using custom embeddings and generates completions via Groq.
    """
    try:
        from app.services.rag import travel_chatbot
        return travel_chatbot(req.message)
    except Exception as e:
        logger.error(f"Error in api_travel_chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug-rag")
def api_debug_rag():
    """
    Diagnostic endpoint to troubleshoot RAG issues on Render.
    """
    debug_info = {}
    
    # Environment variables
    debug_info["ENV"] = {
        "RENDER": os.getenv("RENDER"),
        "USE_LOCAL_EMBEDDINGS": os.getenv("USE_LOCAL_EMBEDDINGS"),
        "HF_TOKEN_SET": os.getenv("HF_TOKEN") is not None,
        "HF_TOKEN_LEN": len(os.getenv("HF_TOKEN", "")),
        "GROQ_API_KEY_SET": os.getenv("GROQ_API_KEY") is not None,
    }
    
    # Path settings
    try:
        from app.services.rag import CHROMA_DB_DIR, USE_LOCAL_EMBEDDINGS, ON_RENDER
        debug_info["CONFIG"] = {
            "CHROMA_DB_DIR": CHROMA_DB_DIR,
            "USE_LOCAL_EMBEDDINGS": USE_LOCAL_EMBEDDINGS,
            "ON_RENDER": ON_RENDER,
        }
        
        # Directory check
        debug_info["DIRECTORY"] = {
            "EXISTS": os.path.exists(CHROMA_DB_DIR),
            "FILES": os.listdir(CHROMA_DB_DIR) if os.path.exists(CHROMA_DB_DIR) else []
        }
    except Exception as e:
        debug_info["CONFIG_ERROR"] = str(e)

    # Collection check
    try:
        from app.services.rag import get_collection
        coll = get_collection()
        debug_info["COLLECTION"] = {
            "INITIALIZED": coll is not None,
            "COUNT": coll.count() if coll is not None else 0
        }
    except Exception as e:
        debug_info["COLLECTION_ERROR"] = str(e)

    # Embedding model / API check
    try:
        from app.services.rag import embed_query
        emb = embed_query("test query")
        debug_info["EMBEDDING_TEST"] = {
            "SUCCESS": True,
            "DIMENSION": len(emb) if isinstance(emb, list) else type(emb).__name__,
            "SAMPLE": emb[:5] if isinstance(emb, list) else None
        }
    except Exception as e:
        debug_info["EMBEDDING_ERROR"] = str(e)

    # Retrieval check
    try:
        from app.services.rag import retrieve_relevant_chunks
        res = retrieve_relevant_chunks("baggage", n_results=3)
        debug_info["RETRIEVAL_TEST"] = {
            "SUCCESS": True,
            "RESULTS_KEYS": list(res.keys()) if isinstance(res, dict) else type(res).__name__,
            "DOCUMENT_COUNT": len(res.get("documents", [[]])[0]) if (isinstance(res, dict) and "documents" in res) else 0,
            "SAMPLE_METADATAS": res.get("metadatas", [[]])[0] if (isinstance(res, dict) and "metadatas" in res) else []
        }
    except Exception as e:
        debug_info["RETRIEVAL_ERROR"] = str(e)
        
    return debug_info
