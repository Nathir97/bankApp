from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    full_name        = Column(String(100), nullable=False)
    email            = Column(String(255), unique=True, index=True, nullable=False)
    phone            = Column(String(20), unique=True, nullable=True)
    hashed_password  = Column(String, nullable=False)
    account_number   = Column(String(20), unique=True, index=True, nullable=False)
    balance          = Column(Numeric(15, 2), default=0.00, nullable=False)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    sent_transactions     = relationship("Transaction", foreign_keys="Transaction.sender_id",     back_populates="sender")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.receiver_id",   back_populates="receiver")
