"""
MediSphere AI — Base Beanie Document
"""
from datetime import UTC, datetime

from beanie import Document
from pydantic import Field


def utc_now() -> datetime:
    return datetime.now(UTC)


class BaseDocument(Document):
    """
    Base document adding required audit fields to all MongoDB collections.
    """
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    created_by: str | None = None
    updated_by: str | None = None
    version: int = 1
    status: str = "ACTIVE"

    async def save(self, *args, **kwargs):
        """Override save to update 'updated_at' and increment 'version'"""
        self.updated_at = utc_now()
        self.version += 1
        return await super().save(*args, **kwargs)

    async def replace(self, *args, **kwargs):
        """Override replace to update 'updated_at' and increment 'version'"""
        self.updated_at = utc_now()
        self.version += 1
        return await super().replace(*args, **kwargs)
