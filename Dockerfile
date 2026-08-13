# -------------------------------------------------------------------------
# GoviHitha — Python agent server
# Build context: repo root
# Usage (local):
#   docker build -t govihitha-agents .
#   docker run -p 8080:8080 -e GOOGLE_API_KEY=... govihitha-agents
# -------------------------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first so this layer is cached
COPY agents/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source (exclude tests and venv)
COPY agents/ ./agents/

# Cloud Run injects PORT; default to 8080
ENV PORT=8080
EXPOSE 8080

# Run with 2 workers — orchestrator is CPU-light (mostly IO-bound Gemini calls)
CMD uvicorn agents.server:app --host 0.0.0.0 --port ${PORT} --workers 2
