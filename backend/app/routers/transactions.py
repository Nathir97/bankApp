from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.transaction import (
    TransferRequest, DepositRequest, WithdrawRequest,
    TransactionOut, TransactionSummary
)
from app.services import transaction_service
from app.models.user import User

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/transfer", response_model=TransactionOut, status_code=201)
def transfer(
    data: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transfer money to another account."""
    return transaction_service.transfer_money(data, current_user, db)

@router.post("/deposit", response_model=TransactionOut, status_code=201)
def deposit(
    data: DepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deposit money into own account."""
    return transaction_service.deposit(data, current_user, db)

@router.post("/withdraw", response_model=TransactionOut, status_code=201)
def withdraw(
    data: WithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Withdraw money from own account."""
    return transaction_service.withdraw(data, current_user, db)

@router.get("/history")
def history(
    txn_type:   Optional[str] = Query(None, description="Filter: transfer | deposit | withdraw"),
    start_date: Optional[str] = Query(None, description="ISO date: 2024-01-01"),
    end_date:   Optional[str] = Query(None, description="ISO date: 2024-12-31"),
    search:     Optional[str] = Query(None, description="Search by reference or description"),
    page:       int           = Query(1, ge=1),
    page_size:  int           = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated transaction history with filters."""
    return transaction_service.get_history(
        current_user, db, txn_type, start_date, end_date, search, page, page_size
    )

@router.get("/summary", response_model=TransactionSummary)
def summary(
    period: str = Query("month", description="week | month | year | all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Pandas-powered financial summary for the period."""
    return transaction_service.get_summary(current_user, db, period)

@router.get("/chart/monthly")
def monthly_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Monthly sent/received/deposit data for dashboard charts."""
    return transaction_service.get_monthly_chart(current_user, db)
