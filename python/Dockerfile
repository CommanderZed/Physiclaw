# Physiclaw Python bridge — goal-only RPC, 3-tier memory, no egress.
FROM python:3.12-slim

WORKDIR /app

# Minimal deps for FTS5 (sqlite3 is in the image) and build
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    curl \
    libsqlite3-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY python/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY python/core ./core
COPY python/cli.py python/bridge.py ./

# Non-root
RUN useradd -m -u 1000 app && chown -R app:app /app
USER app

ENV PHYSICLAW_BRIDGE_PORT=8000
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "bridge:app", "--host", "0.0.0.0", "--port", "8000"]
