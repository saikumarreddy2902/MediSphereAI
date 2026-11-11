#!/usr/bin/env bash
set -e
echo "=== Starting MediSphere AI API Server ==="
export PYTHONPATH="/opt/render/project/src:/opt/render/project/src/backend:$(pwd):$(pwd)/backend:$PYTHONPATH"
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-8000}"

if [ -f "start.py" ]; then
    exec python start.py
elif [ -f "backend/start.py" ]; then
    exec python backend/start.py
else
    exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
fi
