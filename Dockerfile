# ─── Stage 1: Build Next.js Production Frontend ──────────────────────────────
FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY frontend/ ./
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 2: Unified Production Fullstack Runtime ────────────────────────────
FROM python:3.11-slim-bookworm AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app:/app/backend" \
    PORT=10000 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install system dependencies, Node.js 20, Nginx, curl, and envsubst
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl gnupg gettext-base nginx ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install backend Python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/ /app/backend/
COPY app/ /app/app/
COPY start.py sitecustomize.py /app/

# Copy compiled frontend from frontend-builder
COPY --from=frontend-builder /app/frontend /app/frontend

# Configure Nginx reverse proxy
RUN mkdir -p /etc/nginx/templates /etc/nginx/conf.d
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Harden Nginx for non-root execution
RUN sed -i 's/^user /#user /' /etc/nginx/nginx.conf && \
    sed -i 's|/run/nginx.pid|/var/run/nginx.pid|' /etc/nginx/nginx.conf

# Security: Create non-root system user and configure file permissions
RUN groupadd -g 10001 appgroup && \
    useradd -r -u 10001 -g appgroup appuser && \
    mkdir -p /var/cache/nginx /var/log/nginx /var/run /etc/nginx/conf.d && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/run /etc/nginx/conf.d /app && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 10000

# Health check probe for Render deployment zero-downtime routing
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

