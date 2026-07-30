FROM python:3.12-slim

WORKDIR /app

# Environment configuration
ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/app/.cache

# Install dependencies (leverages layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download SentenceTransformer model to cache inside the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application source code
COPY . .

# Pre-build vector database / knowledge base embeddings
RUN python app/knowledge_base/ingest.py

EXPOSE 10000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
