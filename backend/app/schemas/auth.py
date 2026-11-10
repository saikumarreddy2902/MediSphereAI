"""
MediSphere AI — Authentication Schemas

Request and response models for login, token issuance, and user profile endpoints.
"""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Body for username/password authentication."""
    username: str = Field(..., min_length=3, max_length=64, examples=["admin"])
    password: str = Field(..., min_length=6, examples=["password123"])


class TokenResponse(BaseModel):
    """JWT token pair returned on successful authentication."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    roles: list[str]


class UserCreateRequest(BaseModel):
    """Admin-only schema for creating a new system user."""
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    roles: list[str] = ["staff"]
    department_id: str | None = None


class UserProfileResponse(BaseModel):
    """Public-safe user profile returned from /auth/me."""
    id: str = Field(alias="_id")
    username: str
    email: str
    full_name: str
    roles: list[str]
    department_id: str | None
    is_active: bool

    model_config = {"populate_by_name": True}
