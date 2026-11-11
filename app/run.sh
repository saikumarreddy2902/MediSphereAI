#!/usr/bin/env bash
set -e
echo "=== Starting MediSphere AI API Server ==="
export PYTHONPATH="$(pwd):$(pwd)/..:$PYTHONPATH"
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-8000}"

exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
