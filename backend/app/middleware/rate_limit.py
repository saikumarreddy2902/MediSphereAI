"""
MediSphere AI — Rate Limiting Middleware

Applies per-IP rate limits to protect against brute-force and DoS attacks.
Uses slowapi (Starlette-compatible wrapper around limits library).

Limits:
  - /auth/login  → 5 requests / minute  (brute-force protection)
  - All API      → 200 requests / minute per IP
"""
from slowapi import Limiter  # type: ignore[import-untyped]
from slowapi.util import get_remote_address  # type: ignore[import-untyped]

# Global limiter instance — import this in route files to apply @limiter.limit()
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
