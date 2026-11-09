"""
MediSphere AI — API Dependencies
"""
from typing import List, Generator, Optional
from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from app.models.user import User
from app.repositories.core import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Dependency to validate JWT and return the current User document.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    repo = UserRepository()
    user = await repo.get(user_id)
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
        
    return user

class RoleChecker:
    """
    Dependency to enforce Role Based Access Control (RBAC).
    Usage: `Depends(RoleChecker(["admin", "doctor"]))`
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.is_superuser:
            return user
            
        for role in user.roles:
            if role in self.allowed_roles:
                return user
                
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for your role"
        )


class DepartmentAccessChecker:
    """
    Dependency to enforce Department-based Role Access Control (Department RBAC).
    - Superusers and admins ('admin', 'superuser', 'director') have hospital-wide access.
    - Clinical staff (doctors, nurses) are constrained to their assigned department.
    Usage: `Depends(DepartmentAccessChecker(["Cardiology", "ICU"]))`
    """
    def __init__(self, allowed_departments: Optional[List[str]] = None, allow_cross_dept_roles: Optional[List[str]] = None):
        self.allowed_departments = [d.lower() for d in allowed_departments] if allowed_departments else []
        self.allow_cross_dept_roles = [r.lower() for r in (allow_cross_dept_roles or ["admin", "superuser", "emergency_head", "director"])]

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.is_superuser or any(r.lower() in self.allow_cross_dept_roles for r in user.roles):
            return user
            
        user_dept = (user.department_id or "").strip()
        if not user_dept:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department Access Control: No department assigned to your profile. Access restricted."
            )
            
        if self.allowed_departments and user_dept.lower() not in self.allowed_departments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Department Access Denied: You belong to '{user_dept}', but this operation requires access to: {', '.join(self.allowed_departments)}."
            )
        return user


def enforce_department_scope(user: User, requested_department: Optional[str] = None) -> Optional[str]:
    """
    Scopes a request to the user's assigned department if they are a department-bound doctor or nurse.
    - Admins and superusers can query any requested department (or all if None).
    - Bound doctors/nurses are strictly locked to their assigned department.
    """
    if user.is_superuser or any(r.lower() in ["admin", "superuser", "emergency_head", "director"] for r in user.roles):
        return requested_department

    user_dept = (user.department_id or "").strip()
    if not user_dept:
        return requested_department

    if requested_department and requested_department.lower() != user_dept.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Department RBAC Restriction: You can only view and manage records within your assigned department ('{user_dept}')."
        )
    return user_dept

