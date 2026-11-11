"""
MediSphere AI — FastAPI Application Entry Point

Module: Application Initialization & Orchestration
Description: Configures the core FastAPI application instance, CORS policy, exception handlers,
             middleware stack, database connection lifecycles, and API router registrations.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler  # type: ignore[import-untyped]
from slowapi.errors import RateLimitExceeded  # type: ignore[import-untyped]

from app.agents.orchestrator import AgentOrchestrator
from app.api.v1 import (
    agents,
    analytics,
    appointments,
    audit,
    auth,
    beds,
    billing,
    dashboard,
    emergency,
    equipment,
    health,
    insurance,
    laboratory,
    medical_records,
    notifications,
    patients,
    pharmacy,
    prescriptions,
    recommendations,
    staff,
    vitals,
    websocket,
    work_queues,
)
from app.core.cache import cache
from app.core.config import settings
from app.core.exceptions import global_exception_handler
from app.core.logging import setup_logging
from app.core.telemetry import metrics_collector, metrics_middleware
from app.database.connection import close_mongo_connection, connect_to_mongo
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.middleware.rate_limit import limiter
from app.middleware.security_headers import SecurityHeadersMiddleware

# ─── Lifespan Lifecycle Management ──────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """
    Asynchronous context manager handling startup and shutdown events for the application.

    Actions on Startup:
      - Configures structured JSON/Loguru logging.
      - Initializes async Motor engine & Beanie ODM connection to MongoDB Atlas.
      - Instantiates and starts the background AI Agent Orchestrator loop.

    Actions on Shutdown:
      - Gracefully halts background agent threads.
      - Closes active MongoDB connection pools.
    """
    setup_logging()
    print("MediSphere AI starting up...")

    # Establish MongoDB connection via Motor & Beanie ODM
    await connect_to_mongo()

    # Connect Redis cache (gracefully degrades if unavailable)
    await cache.connect()

    # Start background multi-agent orchestrator loop
    orchestrator = AgentOrchestrator()
    app.state.orchestrator = orchestrator
    await orchestrator.start()

    print("All systems operational")
    yield

    # Clean up resources on shutdown
    print("MediSphere AI shutting down...")
    await orchestrator.stop()
    await cache.disconnect()
    await close_mongo_connection()


# ─── Application Instantiation ───────────────────────────────────────────────

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# ─── Global Middleware Stack ──────────────────────────────────────────────────

# Register global catch-all exception handler
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# Attach slowapi rate limiter state to app
app.state.limiter = limiter

# Security headers on every response
app.add_middleware(SecurityHeadersMiddleware)

# Custom request logging and telemetry middleware
app.add_middleware(RequestLoggingMiddleware)
app.middleware("http")(metrics_middleware)

# Cross-Origin Resource Sharing (CORS) security configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression middleware for responses over 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── API Router Registrations ─────────────────────────────────────────────────

API_PREFIX = f"/api/{settings.API_VERSION}"

app.include_router(health.router,          tags=["ops"])
app.include_router(auth.router,            prefix=f"{API_PREFIX}/auth",            tags=["Authentication"])
app.include_router(dashboard.router,       prefix=f"{API_PREFIX}/dashboard",       tags=["Dashboard"])
app.include_router(patients.router,        prefix=f"{API_PREFIX}/patients",        tags=["Patients"])
app.include_router(appointments.router,    prefix=f"{API_PREFIX}/appointments",    tags=["Appointments"])
app.include_router(beds.router,            prefix=f"{API_PREFIX}/beds",            tags=["Beds"])
app.include_router(emergency.router,       prefix=f"{API_PREFIX}/emergency",       tags=["Emergency"])
app.include_router(staff.router,           prefix=f"{API_PREFIX}/staff",           tags=["Staff"])
app.include_router(pharmacy.router,        prefix=f"{API_PREFIX}/pharmacy",        tags=["Pharmacy"])
app.include_router(laboratory.router,      prefix=f"{API_PREFIX}/laboratory",      tags=["Laboratory"])
app.include_router(equipment.router,       prefix=f"{API_PREFIX}/equipment",       tags=["Equipment"])
app.include_router(billing.router,         prefix=f"{API_PREFIX}/billing",         tags=["Billing"])
app.include_router(insurance.router,       prefix=f"{API_PREFIX}/insurance",       tags=["Insurance"])
app.include_router(analytics.router,       prefix=f"{API_PREFIX}/analytics",       tags=["Analytics"])
app.include_router(recommendations.router, prefix=f"{API_PREFIX}/recommendations", tags=["Recommendations"])
app.include_router(notifications.router,   prefix=f"{API_PREFIX}/notifications",   tags=["Notifications"])
app.include_router(agents.router,          prefix=f"{API_PREFIX}/agents",          tags=["AI Agents"])
app.include_router(websocket.router,       prefix=f"{API_PREFIX}",                 tags=["WebSocket"])
app.include_router(medical_records.router, prefix=f"{API_PREFIX}/medical-records", tags=["Medical Records"])
app.include_router(prescriptions.router,  prefix=f"{API_PREFIX}/prescriptions",   tags=["Prescriptions"])
app.include_router(work_queues.router,     prefix=f"{API_PREFIX}/work-queues",     tags=["Department Work Queues"])
app.include_router(audit.router,           prefix=f"{API_PREFIX}/audit",           tags=["Audit Logs"])
app.include_router(vitals.router,          prefix=f"{API_PREFIX}/vitals",          tags=["Vitals Telemetry"])



# ─── System Health & Root Endpoints ─────────────────────────────────────────

@app.get(f"{API_PREFIX}/openapi.json", include_in_schema=False)
def get_v1_openapi() -> dict[str, Any]:
    """
    Expose OpenAPI specification under /api/v1/openapi.json for automated DAST scanners.
    """
    return app.openapi()


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, Any]:
    """
    Lightweight health-check endpoint for load balancers and orchestrators.
    """
    return {
        "status": "healthy",
        "service": "MediSphere AI",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/metrics", tags=["Ops"])
async def get_metrics() -> dict[str, Any]:
    """
    Prometheus telemetry endpoint returning system latency, request rates, and agent cycles.
    """
    return metrics_collector.get_metrics_summary()



@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """
    Root endpoint serving welcome information and interactive documentation link.
    """
    return {
        "message": "Welcome to MediSphere AI Hospital Intelligence System",
        "docs": "/docs",
        "version": "1.0.0",
    }


# ─── HTTP Exception Handlers ─────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for non-existent HTTP routes."""
    return JSONResponse(status_code=404, content={"detail": "Requested resource not found"})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled server exceptions."""
    return JSONResponse(status_code=500, content={"detail": "Internal server processing error"})


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)  # nosec B104

