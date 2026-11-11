#!/usr/bin/env bash
set -e

export PORT="${PORT:-10000}"
export PYTHONPATH="/app:/app/backend:${PYTHONPATH}"

echo "=========================================================="
echo " MediSphere AI — Unified Fullstack Enterprise Platform"
echo " Port: ${PORT} | Environment: ${ENVIRONMENT:-production}"
echo "=========================================================="

# 1. Substitute PORT into nginx configuration
envsubst '${PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# 2. Start FastAPI Backend (127.0.0.1:8000)
echo "[MediSphere] Starting FastAPI backend on 127.0.0.1:8000..."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 &
BACKEND_PID=$!

# 3. Start Next.js Frontend (127.0.0.1:3000)
echo "[MediSphere] Starting Next.js frontend on 127.0.0.1:3000..."
cd /app/frontend
PORT=3000 HOSTNAME=127.0.0.1 npm start &
FRONTEND_PID=$!
cd /app

# 4. Wait for FastAPI health check before opening Nginx traffic
echo "[MediSphere] Awaiting service initialization..."
for i in $(seq 1 30); do
  if curl -s -f http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "[MediSphere] Backend health check PASSED (attempt $i)."
    break
  fi
  sleep 1
done

# 5. Start Nginx
echo "[MediSphere] Starting Nginx reverse proxy on port ${PORT}..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Handle termination signals
trap "echo 'Terminating MediSphere services...'; kill -TERM $BACKEND_PID $FRONTEND_PID $NGINX_PID 2>/dev/null; exit 0" SIGTERM SIGINT

# Wait for any process to terminate
wait -n

