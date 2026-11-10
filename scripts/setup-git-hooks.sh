#!/usr/bin/env bash
# MediSphere AI — Enterprise Git Hooks Setup Script
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "========================================================"
echo "  Setting up MediSphere AI Enterprise Git Hooks"
echo "========================================================"

cd "${REPO_ROOT}"

# Make hooks executable
chmod +x .husky/pre-commit .husky/pre-push 2>/dev/null || true

# Configure git to use .husky
git config core.hooksPath .husky
echo "✅ Configured git core.hooksPath to .husky"

# Dual-install into .git/hooks as fallback
if [ -d ".git/hooks" ]; then
    cp .husky/pre-commit .git/hooks/pre-commit
    cp .husky/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-commit .git/hooks/pre-push 2>/dev/null || true
    echo "✅ Dual-installed hooks into .git/hooks directory"
fi

echo ""
echo "🚀 Git hooks setup complete!"
echo "   - pre-commit: Secret scanner + Ruff linter"
echo "   - pre-push:   Pytest test cases + Frontend typecheck"

