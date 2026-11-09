"""
MediSphere AI — Enterprise Security Core

Module: Security & Authentication Services
Description: Provides Argon2id password hashing and verification complying with OWASP standards,
             as well as JWT access token generation and validation for RBAC control flow.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import settings

# Argon2id password context configured following OWASP guidelines for secure password hashing.
# Automatically handles deprecated hash upgrades if security parameters evolve.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a raw plain-text password against a stored Argon2 hash.

    Args:
        plain_password (str): The plain-text password supplied during authentication.
        hashed_password (str): The Argon2 hashed password stored in the database.

    Returns:
        bool: True if the password matches the hash, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate an OWASP-compliant Argon2id hash for a plain-text password.

    Args:
        password (str): The raw password string to be securely hashed.

    Returns:
        str: Argon2 encoded hash string containing algorithm parameters, salt, and hash.
    """
    return pwd_context.hash(password)


def create_access_token(subject: str | int, role: str, department_id: str | None = None) -> str:
    """
    Create a signed JWT Access Token containing user identification, RBAC role, and department scope.

    Args:
        subject (str | int): User ID or unique identifier subject for the token claim.
        role (str): Security role assigned to the user (e.g., 'admin', 'doctor', 'nurse').
        department_id (str | None): Optional department assignment for department-level RBAC.

    Returns:
        str: Encoded JWT bearer token string.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access"
    }
    if department_id:
        to_encode["department_id"] = department_id
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt



def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate the signature and expiration of an incoming JWT Token.

    Args:
        token (str): Raw JWT bearer token string received from Authorization header.

    Returns:
        Dict[str, Any]: Decoded payload dictionary containing claims ('sub', 'role', 'exp', etc.).

    Raises:
        HTTPException: HTTP 401 Unauthorized error if token signature is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate security credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

