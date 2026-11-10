"""
MediSphere AI — Notifications Service

Business logic for notification management: creation, querying,
marking as read/dismissed, and broadcast notifications from agents.

Bridges the gap between the API layer and MongoDB Beanie model to allow
agents and system processes to send notifications without direct model access.
"""
from datetime import UTC, datetime
from typing import Any

from app.models.notification import Notification


class NotificationsService:
    """Service layer for persistent notification management."""

    async def list_for_user(
        self,
        user_id: str,
        limit: int = 30,
        unread_only: bool = False,
    ) -> dict[str, Any]:
        """
        Return paginated notifications for a specific user.
        Includes both user-targeted and broadcast (user_id=None) notifications.
        """
        query: dict[str, Any] = {
            "$or": [
                {"user_id": user_id},
                {"user_id": None},
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
            "$or": [{"user_id": user_id}, {"user_id": None}],
            "is_read": False,
            "is_dismissed": False,
        }).count()

        return {
            "total": len(notifications),
            "unread": unread_count,
            "notifications": [self._serialize(n) for n in notifications],
        }

    async def mark_read(self, notification_id: str) -> bool:
        """Mark a single notification as read."""
        notification = await Notification.get(notification_id)
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(UTC)
            await notification.save()
            return True
        return False

    async def mark_all_read(self, user_id: str) -> int:
        """Mark all unread notifications for a user as read. Returns count updated."""
        now = datetime.now(UTC)
        unread = await Notification.find({
            "$or": [{"user_id": user_id}, {"user_id": None}],
            "is_read": False,
        }).to_list()
        for n in unread:
            n.is_read = True
            n.read_at = now
            await n.save()
        return len(unread)

    async def create(
        self,
        notification_type: str,
        source: str,
        title: str,
        message: str,
        user_id: str | None = None,
        roles: list[str] | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        source_agent: str | None = None,
    ) -> Notification:
        """Create and persist a new notification."""
        notification = Notification(
            notification_type=notification_type,
            source=source,
            source_agent=source_agent,
            title=title,
            message=message,
            user_id=user_id,
            roles=roles or [],
            resource_type=resource_type,
            resource_id=resource_id,
        )
        await notification.insert()
        return notification

    async def get_unread_count(self, user_id: str) -> int:
        """Return the count of unread notifications for a user."""
        return await Notification.find({
            "$or": [{"user_id": user_id}, {"user_id": None}],
            "is_read": False,
            "is_dismissed": False,
        }).count()

    def _serialize(self, n: Notification) -> dict[str, Any]:
        """Convert a Notification document to a serializable dict."""
        return {
            "id": str(n.id),
            "notification_type": n.notification_type,
            "source": n.source,
            "source_agent": n.source_agent,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "resource_type": n.resource_type,
            "resource_id": n.resource_id,
        }
