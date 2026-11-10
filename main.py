"""
MediSphere AI — Root Application Entrypoint Proxy for Cloud Deployment (Render/Fly.io/Heroku)
Allows running 'uvicorn main:app' directly from the repository root.
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' and all submodules resolve cleanly
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa: E402

__all__ = ["app"]
