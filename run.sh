#!/usr/bin/env bash
set -e
echo "=== Starting MediSphere AI API Server ==="
export PYTHONPATH="$(pwd):$(pwd)/backend:$PYTHONPATH"
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-8000}"

# Run with python -m uvicorn so current directory and subdirectories are always on sys.path
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"

