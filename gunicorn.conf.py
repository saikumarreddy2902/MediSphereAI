"""
MediSphere AI — Gunicorn Configuration for Cloud Deployments (Render / Linux)
Automatically executed by Gunicorn on startup to configure workers, bind addresses,
and ensure the application modules are properly on sys.path.
"""
import os
import sys

# Prepend project root and backend to sys.path so Gunicorn and all worker processes resolve 'app'
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")

for directory in [root_dir, backend_dir, "/opt/render/project/src", "/opt/render/project/src/backend"]:
    if os.path.isdir(directory) and directory not in sys.path:
        sys.path.insert(0, directory)

# Gunicorn settings
pythonpath = f"{root_dir},{backend_dir},.,backend,/opt/render/project/src,/opt/render/project/src/backend"
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5

def on_starting(server):
    print(f"MediSphere AI starting on Gunicorn. Python sys.path: {sys.path[:4]}")

def post_fork(server, worker):
    for directory in [root_dir, backend_dir, "/opt/render/project/src", "/opt/render/project/src/backend"]:
        if os.path.isdir(directory) and directory not in sys.path:
            sys.path.insert(0, directory)
