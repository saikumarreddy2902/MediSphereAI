"""
MediSphere AI — Gunicorn Configuration for Backend Subdirectory Deployment
"""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)

for directory in [backend_dir, root_dir]:
    if os.path.isdir(directory) and directory not in sys.path:
        sys.path.insert(0, directory)

pythonpath = f"{backend_dir},{root_dir},.,backend"
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5

def on_starting(server):
    print(f"MediSphere AI starting on Gunicorn (backend). Python sys.path: {sys.path[:3]}")

def post_fork(server, worker):
    for directory in [backend_dir, root_dir]:
        if os.path.isdir(directory) and directory not in sys.path:
            sys.path.insert(0, directory)

