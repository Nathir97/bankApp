import secrets
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def generate_account_number() -> str:
    """Generate a secure random 12-digit account number."""
    return "".join(secrets.choice(string.digits) for _ in range(12))


def register_user(data: UserRegister, db: Session) -> TokenResponse:
    """Register a new user."""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Generate unique account number
    account_number = generate_account_number()
    while db.query(User).filter(User.account_number == account_number).first():
        account_number = generate_account_number()

    # Create user
    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        account_number=account_number,
        balance=0.00,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return build_token_response(user)


def login_user(data: UserLogin, db: Session) -> TokenResponse:
    """Authenticate user and return tokens."""

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(data.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    return build_token_response(user)


def refresh_tokens(refresh_token: str, db: Session) -> TokenResponse:
    """Generate new tokens using a refresh token."""

    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user = db.query(User).filter(User.id == int(payload["sub"])).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return build_token_response(user)


def build_token_response(user: User) -> TokenResponse:
    """Create access and refresh tokens."""

    token_data = {"sub": str(user.id)}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user)
    )