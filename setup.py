import os
import sys
import site
from setuptools import setup, find_packages

# Eagerly inject .pth files into all available site-packages directories during build
def _inject_pth():
    paths_to_add = [
        "/opt/render/project/src",
        "/opt/render/project/src/backend",
        "/opt/render/project/src/app",
        ".",
        "backend",
        "app",
    ]
    pth_content = "\n".join(paths_to_add) + "\n" + (
        "import sys, os; [sys.path.insert(0, p) for p in "
        "['/opt/render/project/src', '/opt/render/project/src/backend', "
        "os.getcwd(), os.path.join(os.getcwd(), 'backend')] if os.path.exists(p) and p not in sys.path]\n"
    )

    candidate_dirs = set()
    try:
        candidate_dirs.update(site.getsitepackages())
    except Exception:
        pass
    try:
        candidate_dirs.add(site.getusersitepackages())
    except Exception:
        pass
    for p in sys.path:
        if "site-packages" in p or "dist-packages" in p:
            candidate_dirs.add(p)

    for sdir in candidate_dirs:
        if os.path.isdir(sdir):
            try:
                pth_file = os.path.join(sdir, "medisphere_paths.pth")
                with open(pth_file, "w") as f:
                    f.write(pth_content)
            except Exception:
                pass

_inject_pth()

setup(
    name="medisphere-app",
    version="2.1.0",
    packages=find_packages(),
)
