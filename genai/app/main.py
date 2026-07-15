import os
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import FRONTEND_URL, logger
from app.routes.weather import router as weather_router
from app.routes.packing_list import router as packing_list_router
from app.routes.suitcase import router as suitcase_router
from app.routes.chat import router as chat_router

# Initialize the FastAPI application
app = FastAPI(title="🎒Smart Packing Assistant API")

# Pre-load RAG travel_chatbot in a background thread to prevent blocking Uvicorn's port binding.
# This ensures that the application starts up instantly and binds to the port, preventing Render deployment timeouts.
def pre_load_rag():
    try:
        logger.info("Starting background pre-loading of RAG model and ChromaDB...")
        from app.services.rag import get_collection, get_embedding_model
        collection = get_collection()
        get_embedding_model()
        logger.info("Successfully pre-loaded RAG model and ChromaDB cache in the background.")
        
        # Self-healing fallback: If database is empty, run ingestion in the background
        if collection is not None:
            count = 0
            try:
                count = collection.count()
            except Exception as e:
                logger.warning(f"Failed to check ChromaDB document count: {e}")
                
            if count == 0:
                logger.info("ChromaDB collection is empty! Running knowledge base ingestion in the background...")
                from app.knowledge_base.ingest import ingest_pdfs
                ingest_pdfs()
                logger.info("Background knowledge base ingestion completed successfully.")
            else:
                logger.info(f"ChromaDB collection contains {count} documents. Ingestion skipped.")
    except Exception as e:
        logger.error(f"Failed to pre-load or ingest RAG model in background: {e}")

threading.Thread(target=pre_load_rag, daemon=True).start()

# Add CORS middleware to allow the React frontend to communicate with this backend.
app.add_middleware(
    CORSMiddleware, 
    allow_origins=FRONTEND_URL,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Health-check root endpoint
@app.get("/")
def root():
    """
    Root endpoint to verify the API is running successfully.
    Returns: A simple JSON message indicating live status.
    """
    return {"message": "Smart Packing Assistant API is live ✅"}

# Include routers
app.include_router(weather_router)
app.include_router(packing_list_router)
app.include_router(suitcase_router)
app.include_router(chat_router)
