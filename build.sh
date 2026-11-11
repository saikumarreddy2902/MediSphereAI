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

# Permanent .pth injection into site-packages
python -c "
import site, os
sp_list = site.getsitepackages()
for sp in sp_list:
    if os.path.isdir(sp):
        try:
            pth_file = os.path.join(sp, 'medisphere_backend.pth')
            cwd = os.getcwd()
            content = '/opt/render/project/src\n/opt/render/project/src/backend\n/opt/render/project/src/app\n' + cwd + '\n' + os.path.join(cwd, 'backend') + '\n'
            content += 'import sys, os; [sys.path.insert(0, p) for p in [\'/opt/render/project/src\', \'/opt/render/project/src/backend\', os.getcwd(), os.path.join(os.getcwd(), \'backend\')] if os.path.exists(p) and p not in sys.path]\n'
            with open(pth_file, 'w') as f:
                f.write(content)
            print(f'Successfully wrote .pth to {pth_file}')
        except Exception as e:
            print(f'Could not write to {sp}: {e}')
" || true

echo "=== Build Complete ==="
