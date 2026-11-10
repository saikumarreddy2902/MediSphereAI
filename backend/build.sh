#!/usr/bin/env bash
set -e
echo "=== Building MediSphere AI (backend) ==="
echo "Working directory: $(pwd)"
pip install --upgrade pip

if [ -f "requirements.txt" ]; then
    echo "Found ./requirements.txt"
    pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    echo "Found backend/requirements.txt"
    pip install -r backend/requirements.txt
elif [ -f "../requirements.txt" ]; then
    echo "Found ../requirements.txt"
    pip install -r ../requirements.txt
fi

