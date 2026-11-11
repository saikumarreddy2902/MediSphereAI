"""
MediSphere AI — Service Base
"""
from typing import Generic, TypeVar

from app.repositories.base import BaseRepository
from fastapi import HTTPException, status
from pydantic import BaseModel

T = TypeVar("T")


class BaseService(Generic[T]):
    """
    Abstract base service providing common business logic and error handling.
    """
    def __init__(self, repository: BaseRepository[T]):
        self.repository = repository

    async def get_or_404(self, id: str) -> T:
        """Fetch a document by ID or raise a 404 HTTP Exception."""
        doc = await self.repository.get(id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.repository.model.__name__} not found"
            )
        return doc

    async def create(self, create_schema: BaseModel) -> T:
        """Standard creation logic."""
        return await self.repository.create(create_schema)

    async def update(self, id: str, update_schema: BaseModel) -> T:
        """Standard update logic."""
        doc = await self.get_or_404(id)
        return await self.repository.update(doc, update_schema)

    async def delete(self, id: str) -> bool:
        """Standard soft-delete logic."""
        success = await self.repository.delete(id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.repository.model.__name__} not found"
            )
        return True
