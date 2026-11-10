"""
MediSphere AI — Root Proxy Module for 'app.main'
"""
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import the actual application from backend/app/main.py
import importlib
backend_main = importlib.import_module("backend.app.main")
app = getattr(backend_main, "app")

