from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import UserOut
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/lookup")
def lookup_account(
    account_number: str = Query(..., description="Account number to look up"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Look up a user by account number (for transfer verification)."""
    user = db.query(User).filter(User.account_number == account_number).first()
    if not user:
        return {"found": False}
    return {
        "found": True,
        "full_name": user.full_name,
        "account_number": user.account_number,
    }
