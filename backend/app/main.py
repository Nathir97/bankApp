import sys
sys.path.append('backend')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, transactions, users

# Import models so SQLAlchemy registers them before create_all
from app.models import user, transaction  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BankApp API",
    description="Full-stack Banking & Financial Transaction System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(users.router)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "BankApp API", "version": "1.0.0"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
