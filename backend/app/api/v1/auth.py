"""
MediSphere AI — Auth API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.models.user import User
from app.repositories.core import UserRepository
from app.api.deps import get_current_user
from app.middleware.rate_limit import limiter
from app.models.audit import AuditLog

router = APIRouter()

@router.post("/login")
@limiter.limit("60/minute")
async def login_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    Rate limited to 5 attempts/minute per IP to prevent brute-force attacks.
    """
    repo = UserRepository()
    user = await repo.get_by_username(form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Audit failed login attempt
        await AuditLog(
            username=form_data.username,
            action="LOGIN",
            resource="auth",
            ip_address=request.client.host if request.client else None,
            outcome="FAILURE",
            detail="Invalid credentials",
        ).insert()
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    primary_role = user.roles[0] if user.roles else "user"
    user_id_str = str(user.id) if user.id is not None else ""
    access_token = create_access_token(user_id_str, primary_role, department_id=user.department_id)

    # Audit successful login
    await AuditLog(
        user_id=str(user.id),
        username=user.username,
        action="LOGIN",
        resource="auth",
        ip_address=request.client.host if request.client else None,
        outcome="SUCCESS",
    ).insert()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "roles": user.roles,
        "department_id": user.department_id,
        "full_name": user.full_name,
    }


from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = "doctor"
    department_id: Optional[str] = None

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Self-Registration: Create new user account and profile")
async def register_user(request: Request, body: UserRegisterRequest):
    """
    Allow users to create their own account and profile in MediSphere AI.
    Checks uniqueness of username and email, creates the account, and returns JWT tokens.
    """
    # Check if username already exists
    existing_username = await User.find_one(User.username == body.username.strip().lower())
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{body.username}' is already registered."
        )

    # Check if email already exists
    existing_email = await User.find_one(User.email == body.email.strip().lower())
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{body.email}' is already associated with an account."
        )

    # Security: Only safe roles can be self-assigned.
    # Admin/superuser roles must be explicitly granted by an existing admin via a separate admin endpoint.
    SELF_REGISTRATION_ROLES = {"doctor", "nurse", "patient", "staff"}
    assigned_role = (body.role or "patient").lower().strip()
    if assigned_role not in SELF_REGISTRATION_ROLES:
        assigned_role = "patient"  # Fall back to least-privileged role

    hashed_pw = get_password_hash(body.password)
    new_user = User(
        username=body.username.strip().lower(),
        email=body.email.strip().lower(),
        hashed_password=hashed_pw,
        full_name=body.full_name.strip(),
        roles=[assigned_role],
        department_id=body.department_id,
        is_active=True,
        is_superuser=False,  # NEVER granted via self-registration. Admins must be promoted by another admin.
    )
    await new_user.insert()

    # Record Audit Event
    await AuditLog(
        user_id=str(new_user.id),
        username=new_user.username,
        action="REGISTER",
        resource="auth",
        ip_address=request.client.host if request.client else None,
        outcome="SUCCESS",
        detail=f"Self-registered user with role '{assigned_role}'",
    ).insert()

    user_id_str = str(new_user.id)
    access_token = create_access_token(user_id_str, assigned_role, department_id=new_user.department_id)

    return {
        "message": "Account created successfully.",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id_str,
        "roles": new_user.roles,
        "department_id": new_user.department_id,
        "user": {
            "id": user_id_str,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "roles": new_user.roles,
            "department_id": new_user.department_id,
        }
    }


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user profile.
    """
    return current_user.model_dump(by_alias=True, exclude={"hashed_password"})

@router.put("/me", summary="Update current user's profile")
async def update_my_profile(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Allows the authenticated user to update their own profile information and change password.
    """
    if body.full_name:
        current_user.full_name = body.full_name.strip()
    
    if body.email:
        # If changing email, ensure it's not taken by another user
        existing_email = await User.find_one(User.email == body.email.strip().lower())
        if existing_email and str(existing_email.id) != str(current_user.id):
            raise HTTPException(status_code=400, detail="Email is already taken by another account.")
        current_user.email = body.email.strip().lower()

    if body.new_password:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password.")
        if not verify_password(body.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password does not match.")
        if len(body.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
        current_user.hashed_password = get_password_hash(body.new_password)

    await current_user.save()

    # Record Audit
    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="UPDATE_PROFILE",
        resource="auth",
        outcome="SUCCESS",
        detail="User updated their profile details",
    ).insert()

    return {
        "message": "Profile updated successfully.",
        "user": current_user.model_dump(by_alias=True, exclude={"hashed_password"})
    }



@router.post("/refresh", summary="Refresh access token")
async def refresh_access_token(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Exchange a still-valid access token for a new one with a fresh expiry.
    The client should call this before the token expires to maintain session continuity.
    """
    primary_role = current_user.roles[0] if current_user.roles else "user"
    user_id_str = str(current_user.id) if current_user.id is not None else ""
    new_token = create_access_token(user_id_str, primary_role)
    return {
        "access_token": new_token,
        "token_type": "bearer",
    }


@router.post("/logout", summary="Logout (client-side token invalidation)")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Records a logout audit event. The client must discard the JWT token.
    Server-side token blacklisting requires Redis integration (future enhancement).
    """
    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="LOGOUT",
        resource="auth",
        outcome="SUCCESS",
    ).insert()
    return {"message": "Logged out successfully. Please discard your access token."}


# ─── In-memory OTP store (production: use Redis with TTL) ────────────────────
import secrets
import time
_OTP_STORE: dict = {}   # email → {otp, expires}


from pydantic import BaseModel as PM, EmailStr

class ResetRequestSchema(PM):
    email: EmailStr

class VerifyOTPSchema(PM):
    email: EmailStr
    otp: str
    new_password: str


@router.post("/request-password-reset", summary="Request password reset OTP")
async def request_password_reset(payload: ResetRequestSchema):
    """
    Generates a 6-digit OTP for the given email and would send it via email in production.
    Demo: OTP is returned directly in the response for testing.
    """
    repo = UserRepository()
    user = await repo.get_by_email(str(payload.email))
    # Do not reveal whether email exists (security)
    otp = str(secrets.randbelow(900000) + 100000)
    _OTP_STORE[str(payload.email)] = {"otp": otp, "expires": time.time() + 600}  # 10 min TTL
    # In production: send email with OTP via AWS SES / SendGrid
    return {
        "message": "If this email is registered, an OTP has been sent.",
        "demo_otp": otp,   # Remove in production
    }


@router.post("/reset-password", summary="Reset password with OTP verification")
async def reset_password(payload: VerifyOTPSchema):
    """
    Verifies the OTP and updates the user's password.
    """
    email_str = str(payload.email)
    stored = _OTP_STORE.get(email_str)
    if not stored:
        raise HTTPException(status_code=400, detail="No reset request found for this email. Please request a new OTP.")
    if time.time() > stored["expires"]:
        del _OTP_STORE[email_str]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if stored["otp"] != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    repo = UserRepository()
    user = await repo.get_by_email(email_str)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    await user.save()

    del _OTP_STORE[email_str]

    await AuditLog(
        user_id=str(user.id),
        username=user.username,
        action="PASSWORD_RESET",
        resource="auth",
        outcome="SUCCESS",
    ).insert()

    return {"message": "Password updated successfully. Please log in with your new password."}

