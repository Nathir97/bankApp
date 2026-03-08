from pydantic import BaseModel, field_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.models.transaction import TransactionStatus, TransactionType

class TransferRequest(BaseModel):
    receiver_account: str
    amount: Decimal
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        if v > 1_000_000:
            raise ValueError("Transfer limit is 1,000,000 per transaction")
        return v

class DepositRequest(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class WithdrawRequest(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class TransactionOut(BaseModel):
    id: int
    reference: str
    type: TransactionType
    status: TransactionStatus
    amount: Decimal
    description: Optional[str]
    sender_id: Optional[int]
    receiver_id: Optional[int]
    sender_balance_after: Optional[Decimal]
    receiver_balance_after: Optional[Decimal]
    created_at: datetime

    # Nested names for display
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    sender_account: Optional[str] = None
    receiver_account: Optional[str] = None

    class Config:
        from_attributes = True

class TransactionSummary(BaseModel):
    total_sent: Decimal
    total_received: Decimal
    total_deposits: Decimal
    total_withdrawals: Decimal
    net_flow: Decimal
    transaction_count: int
    period: str
