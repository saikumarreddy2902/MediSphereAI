"""
MediSphere AI — Auth Models
"""

from app.models.base import BaseDocument
from beanie import Indexed
from pydantic import EmailStr


class Permission(BaseDocument):
    name: Indexed(str, unique=True)
    description: str
    
    class Settings:
        name = "permissions"


class Role(BaseDocument):
    name: Indexed(str, unique=True)
    description: str
    permissions: list[str] = []  # List of permission names
    
    class Settings:
        name = "roles"


class User(BaseDocument):
    username: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    full_name: str
    roles: list[str] = []  # List of role names
    department_id: str | None = None
    is_active: bool = True
    is_superuser: bool = False

    class Settings:
        name = "users"
