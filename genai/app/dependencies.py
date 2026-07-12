from fastapi import Header, HTTPException
from app.config.settings import GENAI_API_SECRET, logger

def verify_api_key(x_api_key: str = Header(None)):
    if not GENAI_API_SECRET:
        logger.warning("GENAI_API_SECRET is not set. Service is unprotected!")
    elif x_api_key != GENAI_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")
