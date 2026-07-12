"""
Smart Packing Assistant API - FastAPI Backend

This Python fastAPI service acts as the GenAI backend for the Smart Packing Assistant application. 
It receives trip details from the frontend, queries an LLM (Groq API) for a customized packing list 
in JSON format, and returns the list. It also provides functionality to save trips to a separate Node.js 
MongoDB backend and generate downloadable DOCX files.
"""

import os
import uvicorn
from app.main import app

if __name__ == "__main__":
    # Start the server using Uvicorn. Enables hot-reload during active development.
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5001)), # Changed to 5001 to prevent Node port collision
        reload=False
    )
