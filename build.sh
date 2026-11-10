#!/usr/bin/env bash
set -e
echo "=== Building MediSphere AI ==="
echo "Working directory: $(pwd)"
python -m pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    echo "Found ./requirements.txt"
    python -m pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    echo "Found backend/requirements.txt"
    python -m pip install -r backend/requirements.txt
elif [ -f "../requirements.txt" ]; then
    echo "Found ../requirements.txt"
    python -m pip install -r ../requirements.txt
fi

# Editable package install
if [ -f "setup.py" ]; then
    echo "Installing package via setup.py"
    python -m pip install -e .
fi
if [ -f "backend/setup.py" ]; then
    echo "Installing backend package via backend/setup.py"
    python -m pip install -e ./backend
fi

# Permanent .pth injection into site-packages
python -c "
import site, os
sp_list = site.getsitepackages()
for sp in sp_list:
    if os.path.isdir(sp):
        try:
            pth_file = os.path.join(sp, 'medisphere_backend.pth')
            cwd = os.getcwd()
            backend_dir = os.path.join(cwd, 'backend') if not cwd.endswith('backend') else cwd
            with open(pth_file, 'w') as f:
                f.write(backend_dir + '\n' + cwd + '\n')
            print(f'Successfully wrote .pth to {pth_file} -> {backend_dir}')
        except Exception as e:
            print(f'Could not write to {sp}: {e}')
" || true

echo "=== Build Complete ==="
