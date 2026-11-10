"""
MediSphere AI — Audit Log Model

Persists a tamper-evident record of every security-sensitive operation:
authentication events, data mutations, permission changes, and critical reads.

This supports HIPAA audit trail requirements and forensic investigation.
"""
from datetime import UTC, datetime

from app.models.base import BaseDocument


class AuditLog(BaseDocument):
    """
    Immutable audit trail entry for a security-sensitive operation.

    Fields:
        user_id      — ID of the authenticated user performing the action (None = unauthenticated)
        username     — username at time of action (denormalized for readability)
        action       — verb describing the operation (LOGIN, CREATE, UPDATE, DELETE, ACCESS)
        resource     — resource type acted upon (e.g. "patient", "bill", "user")
        resource_id  — ID of the specific resource (if applicable)
        ip_address   — client IP address extracted from request
        user_agent   — client User-Agent header
        outcome      — SUCCESS or FAILURE
        detail       — optional human-readable detail or error message
        timestamp    — UTC timestamp when the action occurred
    """
    user_id: str | None = None
    username: str | None = None
    action: str                          # e.g. LOGIN, CREATE_PATIENT, DELETE_BILL
    resource: str                        # e.g. "patient", "appointment"
    resource_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    outcome: str = "SUCCESS"             # SUCCESS | FAILURE
    detail: str | None = None
    timestamp: datetime = None           # type: ignore[assignment]

    def __init__(self, **data):
        if "timestamp" not in data or data["timestamp"] is None:
            data["timestamp"] = datetime.now(UTC)
        super().__init__(**data)

    class Settings:
        name = "audit_logs"
        # Audit logs are append-only: never update, only insert
        indexes = [
            "user_id",
            "resource",
            "timestamp",
        ]
