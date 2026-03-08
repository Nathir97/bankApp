import uuid
import pandas as pd
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.transaction import (
    TransferRequest, DepositRequest, WithdrawRequest,
    TransactionOut, TransactionSummary
)

def _make_ref() -> str:
    return "TXN" + uuid.uuid4().hex[:12].upper()

def _to_out(txn: Transaction) -> TransactionOut:
    out = TransactionOut.model_validate(txn)
    if txn.sender:
        out.sender_name    = txn.sender.full_name
        out.sender_account = txn.sender.account_number
    if txn.receiver:
        out.receiver_name    = txn.receiver.full_name
        out.receiver_account = txn.receiver.account_number
    return out

# ── TRANSFER ─────────────────────────────────────────────────────────────────
def transfer_money(data: TransferRequest, sender: User, db: Session) -> TransactionOut:
    if sender.account_number == data.receiver_account:
        raise HTTPException(status_code=400, detail="Cannot transfer to your own account")

    receiver = db.query(User).filter(User.account_number == data.receiver_account).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver account not found")
    if not receiver.is_active:
        raise HTTPException(status_code=400, detail="Receiver account is inactive")
    if sender.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    s_before = sender.balance
    r_before = receiver.balance

    sender.balance   -= data.amount
    receiver.balance += data.amount

    txn = Transaction(
        reference=_make_ref(),
        type=TransactionType.transfer,
        status=TransactionStatus.completed,
        amount=data.amount,
        description=data.description,
        sender_id=sender.id,
        receiver_id=receiver.id,
        sender_balance_before=s_before,
        sender_balance_after=sender.balance,
        receiver_balance_before=r_before,
        receiver_balance_after=receiver.balance,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _to_out(txn)

# ── DEPOSIT ──────────────────────────────────────────────────────────────────
def deposit(data: DepositRequest, user: User, db: Session) -> TransactionOut:
    before = user.balance
    user.balance += data.amount
    txn = Transaction(
        reference=_make_ref(),
        type=TransactionType.deposit,
        status=TransactionStatus.completed,
        amount=data.amount,
        description="Deposit",
        receiver_id=user.id,
        receiver_balance_before=before,
        receiver_balance_after=user.balance,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _to_out(txn)

# ── WITHDRAW ─────────────────────────────────────────────────────────────────
def withdraw(data: WithdrawRequest, user: User, db: Session) -> TransactionOut:
    if user.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    before = user.balance
    user.balance -= data.amount
    txn = Transaction(
        reference=_make_ref(),
        type=TransactionType.withdraw,
        status=TransactionStatus.completed,
        amount=data.amount,
        description="Withdrawal",
        sender_id=user.id,
        sender_balance_before=before,
        sender_balance_after=user.balance,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _to_out(txn)

# ── HISTORY ──────────────────────────────────────────────────────────────────
def get_history(
    user: User,
    db: Session,
    txn_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = db.query(Transaction).filter(
        or_(Transaction.sender_id == user.id, Transaction.receiver_id == user.id)
    )
    if txn_type:
        query = query.filter(Transaction.type == txn_type)
    if start_date:
        query = query.filter(Transaction.created_at >= start_date)
    if end_date:
        query = query.filter(Transaction.created_at <= end_date)
    if search:
        query = query.filter(
            or_(
                Transaction.reference.ilike(f"%{search}%"),
                Transaction.description.ilike(f"%{search}%"),
            )
        )
    total = query.count()
    txns  = query.order_by(Transaction.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "items": [_to_out(t) for t in txns],
    }

# ── SUMMARY (Pandas) ─────────────────────────────────────────────────────────
def get_summary(user: User, db: Session, period: str = "month") -> TransactionSummary:
    txns = db.query(Transaction).filter(
        or_(Transaction.sender_id == user.id, Transaction.receiver_id == user.id),
        Transaction.status == TransactionStatus.completed,
    ).all()

    if not txns:
        return TransactionSummary(
            total_sent=Decimal(0), total_received=Decimal(0),
            total_deposits=Decimal(0), total_withdrawals=Decimal(0),
            net_flow=Decimal(0), transaction_count=0, period=period,
        )

    # Build DataFrame for Pandas aggregation
    rows = []
    for t in txns:
        rows.append({
            "id": t.id,
            "type": t.type.value,
            "amount": float(t.amount),
            "is_sender": t.sender_id == user.id,
            "created_at": t.created_at,
        })

    df = pd.DataFrame(rows)
    df["created_at"] = pd.to_datetime(df["created_at"])
    now = pd.Timestamp.now(tz="UTC")

    if period == "week":
        df = df[df["created_at"] >= now - pd.Timedelta(weeks=1)]
    elif period == "month":
        df = df[df["created_at"] >= now - pd.DateOffset(months=1)]
    elif period == "year":
        df = df[df["created_at"] >= now - pd.DateOffset(years=1)]

    sent         = df[(df["type"] == "transfer") & (df["is_sender"] == True)]["amount"].sum()
    received     = df[(df["type"] == "transfer") & (df["is_sender"] == False)]["amount"].sum()
    deposits     = df[df["type"] == "deposit"]["amount"].sum()
    withdrawals  = df[df["type"] == "withdraw"]["amount"].sum()

    return TransactionSummary(
        total_sent=Decimal(str(sent)),
        total_received=Decimal(str(received)),
        total_deposits=Decimal(str(deposits)),
        total_withdrawals=Decimal(str(withdrawals)),
        net_flow=Decimal(str(received + deposits - sent - withdrawals)),
        transaction_count=len(df),
        period=period,
    )

# ── MONTHLY CHART DATA ────────────────────────────────────────────────────────
def get_monthly_chart(user: User, db: Session) -> list:
    txns = db.query(Transaction).filter(
        or_(Transaction.sender_id == user.id, Transaction.receiver_id == user.id),
        Transaction.status == TransactionStatus.completed,
    ).all()

    if not txns:
        return []

    rows = []
    for t in txns:
        rows.append({
            "type": t.type.value,
            "amount": float(t.amount),
            "is_sender": t.sender_id == user.id,
            "created_at": t.created_at,
        })

    df = pd.DataFrame(rows)
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["month"] = df["created_at"].dt.strftime("%b %Y")

    result = []
    for month, group in df.groupby("month"):
        sent     = group[(group["type"] == "transfer") & (group["is_sender"])]["amount"].sum()
        received = group[(group["type"] == "transfer") & (~group["is_sender"])]["amount"].sum()
        deposits = group[group["type"] == "deposit"]["amount"].sum()
        result.append({"month": month, "sent": sent, "received": received, "deposits": deposits})

    return result
