from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TransactionStatus(str, enum.Enum):
    pending   = "pending"
    completed = "completed"
    failed    = "failed"
    reversed  = "reversed"

class TransactionType(str, enum.Enum):
    transfer = "transfer"
    deposit  = "deposit"
    withdraw = "withdraw"

class Transaction(Base):
    __tablename__ = "transactions" 

    id           = Column(Integer, primary_key=True, index=True)
    reference    = Column(String(30), unique=True, index=True, nullable=False)
    type         = Column(Enum(TransactionType), nullable=False)
    status       = Column(Enum(TransactionStatus), default=TransactionStatus.completed, nullable=False)
    amount       = Column(Numeric(15, 2), nullable=False)
    description  = Column(Text, nullable=True)
    sender_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    receiver_id  = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Balance snapshots for audit trail
    sender_balance_before   = Column(Numeric(15, 2), nullable=True)
    sender_balance_after    = Column(Numeric(15, 2), nullable=True)
    receiver_balance_before = Column(Numeric(15, 2), nullable=True)
    receiver_balance_after  = Column(Numeric(15, 2), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    sender   = relationship("User", foreign_keys=[sender_id],   back_populates="sent_transactions")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_transactions")
