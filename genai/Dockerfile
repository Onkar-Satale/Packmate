# Use official Python image
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Set Hugging Face cache directory to a shared location within the container
ENV HF_HOME=/app/.cache

# Copy your genai contents into the container
COPY . /app

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Pre-download the SentenceTransformer model to cache it in the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Run the knowledge ingestion script to populate ChromaDB in the Docker image
RUN python app/knowledge_base/ingest.py

# Ensure all files inside /app (including cached models and ChromaDB) are readable and writable by any non-root user
RUN chmod -R 777 /app

# Set python log buffering to off so logs stream immediately
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 10000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}