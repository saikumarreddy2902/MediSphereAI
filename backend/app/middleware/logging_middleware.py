"""
MediSphere AI — Logging Middleware
"""
import time
import uuid

from fastapi import Request
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Bind context to logger
        with logger.contextualize(request_id=request_id, path=request.url.path, method=request.method):
            logger.info(f"Incoming Request: {request.method} {request.url.path}")
            
            try:
                response = await call_next(request)
                process_time = time.time() - start_time
                response.headers["X-Process-Time"] = str(process_time)
                response.headers["X-Request-ID"] = request_id
                
                logger.info(f"Completed Request: {response.status_code} in {process_time:.4f}s")
                return response
            except Exception as exc:
                process_time = time.time() - start_time
                logger.exception(f"Request failed with unhandled exception in {process_time:.4f}s: {exc}")
                raise
