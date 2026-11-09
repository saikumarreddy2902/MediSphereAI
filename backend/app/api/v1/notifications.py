"""
MediSphere AI — Notifications API (Real persistent implementation)

Replaces the previous mock data generator with real MongoDB-backed notifications.
Supports querying, marking as read/dismissed, and internal creation from agents.
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    notification_type: str = "info"
    source: str = "SYSTEM"
    source_agent: Optional[str] = None
    title: str
    message: str
    user_id: Optional[str] = None
    roles: List[str] = []
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None


class NotificationResponse(BaseModel):
    id: Optional[str] = None
    notification_type: str
    source: str
    source_agent: Optional[str]
    title: str
    message: str
    is_read: bool
    created_at: Optional[datetime]
    resource_type: Optional[str]
    resource_id: Optional[str]

    class Config:
        from_attributes = True


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/", summary="List notifications for current user")
async def list_notifications(
    limit: int = Query(30, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """Return recent notifications scoped to the current user or broadcast."""
    query: dict = {
        "$or": [
            {"user_id": str(current_user.id)},
            {"user_id": None},             # Broadcast notifications
        ],
        "is_dismissed": False,
    }
    if unread_only:
        query["is_read"] = False

    notifications = (
        await Notification.find(query)
        .sort("-created_at")
        .limit(limit)
        .to_list()
    )

    unread_count = await Notification.find({
        "$or": [{"user_id": str(current_user.id)}, {"user_id": None}],
        "is_read": False,
        "is_dismissed": False,
    }).count()

    return {
        "total": len(notifications),
        "unread": unread_count,
        "notifications": [_to_response(n) for n in notifications],
    }


@router.post("/{notification_id}/read", summary="Mark a notification as read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    notification = await Notification.get(notification_id)
    if notification and not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await notification.save()
    return {"message": "Marked as read", "id": notification_id}


@router.post("/mark-all-read", summary="Mark all notifications as read")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    """Mark all unread notifications for the current user as read."""
    now = datetime.now(timezone.utc)
    unread = await Notification.find({
        "$or": [{"user_id": str(current_user.id)}, {"user_id": None}],
        "is_read": False,
    }).to_list()
    for n in unread:
        n.is_read = True
        n.read_at = now
        await n.save()
    return {"message": f"Marked {len(unread)} notifications as read"}


@router.post(
    "/",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a notification (internal / agent use)",
)
async def create_notification(
    notification_in: NotificationCreate,
    current_user: User = Depends(RoleChecker(["admin", "system"])),
) -> NotificationResponse:
    """Create a new notification (used by agents and system processes)."""
    notification = Notification(**notification_in.model_dump())
    await notification.insert()
    return _to_response(notification)


# ─── Helper ──────────────────────────────────────────────────────────────────

def _to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        notification_type=n.notification_type,
        source=n.source,
        source_agent=n.source_agent,
        title=n.title,
        message=n.message,
        is_read=n.is_read,
        created_at=n.created_at,
        resource_type=n.resource_type,
        resource_id=n.resource_id,
    )
