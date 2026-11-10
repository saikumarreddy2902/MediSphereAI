"""
MediSphere AI — Root Proxy Package for 'app'
Extends module search path to 'backend/app' so all submodules (api, agents, models, services, etc.)
are found directly whether running from repository root or backend.
"""
import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

backend_app_dir = backend_dir / "app"
if str(backend_app_dir) not in __path__:
    __path__.append(str(backend_app_dir))

