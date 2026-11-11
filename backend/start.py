"""
MediSphere AI — Universal Cloud Production Server Launcher
Works seamlessly on Render, Railway, Fly.io, Docker, and Local environments.
Guarantees correct sys.path configuration regardless of working directory or invocation method.
"""
import os
import sys
from pathlib import Path

# Automatically discover and add project directories to sys.path
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
search_dirs = [
    current_dir,
    current_dir / "app",
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

# Ensure app can be imported
try:
    from app.main import app
    print(f"[MediSphere] Successfully loaded FastAPI application from: {sys.modules['app'].__file__}")
except Exception as e:
    print(f"[MediSphere FATAL] Failed to import app: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
    print(f"[MediSphere] Starting Uvicorn server on {host}:{port} with {workers} worker(s)...")
    uvicorn.run("start:app", host=host, port=port, reload=False, workers=workers)
