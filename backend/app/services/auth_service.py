import random
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token

def generate_account_number() -> str:
    """Generate a unique 12-digit account number."""
    return "".join(random.choices(string.digits, k=12))

def register_user(data: UserRegister, db: Session) -> TokenResponse:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate unique account number
    account_number = generate_account_number()
    while db.query(User).filter(User.account_number == account_number).first():
        account_number = generate_account_number()

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        account_number=account_number,
        balance=0.00,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)

def login_user(data: UserLogin, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    return _build_token_response(user)

def refresh_tokens(refresh_token: str, db: Session) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _build_token_response(user)

def _build_token_response(user: User) -> TokenResponse:
    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserOut.model_validate(user),
    )
