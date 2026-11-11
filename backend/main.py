"""
MediSphere AI — Backend Application Entrypoint Proxy for Cloud Deployment (Render/Fly.io/Heroku)
Allows running 'uvicorn main:app' directly from the backend directory.
"""
import os
import sys
from pathlib import Path

# Automatically discover and add project directories to sys.path
root_dir = Path(__file__).resolve().parent
parent_dir = root_dir.parent
search_dirs = [
    root_dir,
    root_dir / "app",
    parent_dir,
    parent_dir / "backend",
    parent_dir / "app",
    Path("/opt/render/project/src"),
    Path("/opt/render/project/src/backend"),
    Path("/opt/render/project/src/app"),
    Path(os.getcwd()),
    Path(os.getcwd()) / "backend",
    Path(os.getcwd()) / "app",
]

for d in search_dirs:
    d_str = str(d)
    if d.exists() and d_str not in sys.path:
        sys.path.insert(0, d_str)

from app.main import app  # noqa: E402

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
    print(f"[MediSphere] Starting Uvicorn on {host}:{port} with {workers} worker(s)...")
    uvicorn.run("main:app", host=host, port=port, reload=False, workers=workers)
