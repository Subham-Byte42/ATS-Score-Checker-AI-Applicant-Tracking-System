# =============================================================================
# Stage 1: Builder Stage - Install dependencies with CPU-only PyTorch
# =============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build-time system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications
COPY requirements.txt .

# Install CPU-only PyTorch first to prevent downloading huge CUDA binaries (>4GB)
RUN pip install --no-cache-dir --user --extra-index-url https://download.pytorch.org/whl/cpu \
    torch \
    && pip install --no-cache-dir --user -r requirements.txt

# Pre-download Sentence-Transformer weights into cache to eliminate cold starts
RUN python3 -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# =============================================================================
# Stage 2: Production Runtime Stage
# =============================================================================
FROM python:3.11-slim AS runtime

# Optimization flags
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/root/.local/bin:$PATH" \
    PORT=8080

WORKDIR /app

# Install minimal runtime libraries for PyMuPDF & docx processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy installed wheels and pre-cached transformer models from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /root/.cache /root/.cache

# Copy application source code
COPY app/ /app/app/
COPY requirements.txt /app/

# Expose container port (compatible with Cloud Run default PORT=8080 or ECS)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/healthz || exit 1

# Start FastAPI application via Uvicorn with production worker configuration
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2 --timeout-keep-alive 30"]
