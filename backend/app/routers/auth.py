from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut, RefreshRequest
from app.services import auth_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and return JWT tokens."""
    return auth_service.register_user(data, db)

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with email + password, returns JWT tokens."""
    return auth_service.login_user(data, db)

@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    """Get new access token using refresh token."""
    return auth_service.refresh_tokens(data.refresh_token, db)

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user
