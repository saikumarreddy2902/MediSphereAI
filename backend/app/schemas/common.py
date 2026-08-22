"""
MediSphere AI — Common / Shared Schemas

Re-usable generic response wrappers used across all API endpoints.
"""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class BaseResponse(BaseModel):
    """
    Base class for all *Response schemas.
    Coerces MongoDB ObjectId → str for the `id` / `_id` field automatically,
    preventing ResponseValidationError when Beanie returns ObjectId instances.
    """
    id: Optional[str] = Field(None, alias="_id")

    @field_validator("id", mode="before")
    @classmethod
    def coerce_objectid(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        return str(v)

    model_config = {"populate_by_name": True}


class SuccessResponse(BaseModel):
    """Generic success acknowledgment response."""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard error response shape returned by global exception handler."""
    success: bool = False
    detail: str
    error_code: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated list response.

    Usage:
        PaginatedResponse[PatientResponse](items=[...], total=100, skip=0, limit=20)
    """
    items: List[T]
    total: int
    skip: int = 0
    limit: int = 20
    has_more: bool = Field(default=False)

    def model_post_init(self, __context: Any) -> None:
        self.has_more = (self.skip + self.limit) < self.total

