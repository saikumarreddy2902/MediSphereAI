"""
MediSphere AI — Security Headers Middleware

Injects industry-standard HTTP security response headers into every response
to protect against clickjacking, MIME-sniffing, XSS, and information leakage.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds OWASP-recommended HTTP security headers to every outgoing response.

    Headers injected:
      - X-Content-Type-Options: nosniff           — prevent MIME-type sniffing
      - X-Frame-Options: DENY                     — block clickjacking
      - X-XSS-Protection: 1; mode=block           — legacy XSS filter
      - Strict-Transport-Security                  — enforce HTTPS (production)
      - Referrer-Policy: strict-origin-when-cross-origin
      - Permissions-Policy                         — restrict browser APIs
      - Content-Security-Policy                   — restrict resource origins
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent MIME-type sniffing attacks
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Block framing to prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS filter (still respected by some browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Force HTTPS for 1 year, including subdomains
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict browser feature access
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Basic CSP — restricts scripts/styles to same origin; adjust as needed
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' wss:; "
            "frame-ancestors 'none';"
        )

        return response
