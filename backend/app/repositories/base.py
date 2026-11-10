"""
MediSphere AI — Abstract Base Repository
"""
from typing import Any, Generic, TypeVar

from beanie import Document
from pydantic import BaseModel

# T is the Beanie Document type
T = TypeVar("T", bound=Document)


class BaseRepository(Generic[T]):
    """
    Abstract base repository for all MongoDB collections.
    Provides standard CRUD, pagination, and projection methods.
    """
    def __init__(self, model: type[T]):
        self.model = model

    async def create(self, obj_in: BaseModel | dict) -> T:
        """Create a new document."""
        if isinstance(obj_in, dict):
            doc = self.model(**obj_in)
        else:
            doc = self.model(**obj_in.model_dump())
        return await doc.insert()

    async def get(self, id: str) -> T | None:
        """Get a document by ID."""
        return await self.model.get(id)

    async def get_by_field(self, field: str, value: Any) -> T | None:
        """Get a single document by a specific field."""
        return await self.model.find_one({field: value})

    async def get_multi(self, skip: int = 0, limit: int = 100, query: dict | None = None) -> list[T]:
        """Get multiple documents with pagination and optional query filter."""
        find_query = self.model.find(query or {})
        return await find_query.skip(skip).limit(limit).to_list()

    async def update(self, db_obj: T, obj_in: BaseModel | dict) -> T:
        """Update a document."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        return await db_obj.save()

    async def delete(self, id: str) -> bool:
        """Soft delete a document (sets status to DELETED if status attribute exists, else deletes)."""
        doc = await self.get(id)
        if doc:
            if hasattr(doc, "status"):
                doc.status = "DELETED"
                await doc.save()
            else:
                await doc.delete()
            return True
        return False

    async def count(self, query: dict | None = None) -> int:
        """Count documents matching a query."""
        return await self.model.find(query or {}).count()
