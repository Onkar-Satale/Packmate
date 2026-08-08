# Route definitions for RAG-based travel chatbot API

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import verify_api_key
from app.schemas.schemas import ChatRequest
from app.config.settings import logger

router = APIRouter()


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
