import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# Use SQLite for tests (no Postgres needed)
TEST_DB_URL = "sqlite:///./test.db"
engine_test = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine_test)
client = TestClient(app)

REGISTER_DATA = {
    "full_name": "Althaf Ahamed",
    "email": "althaf@test.com",
    "password": "securepass123",
}

def test_health():
    r = client.get("/health")
    assert r.status_code == 200

def test_register():
    r = client.post("/auth/register", json=REGISTER_DATA)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == REGISTER_DATA["email"]
    assert len(data["user"]["account_number"]) == 12

def test_login():
    r = client.post("/auth/login", json={"email": REGISTER_DATA["email"], "password": REGISTER_DATA["password"]})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_me():
    login = client.post("/auth/login", json={"email": REGISTER_DATA["email"], "password": REGISTER_DATA["password"]})
    token = login.json()["access_token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == REGISTER_DATA["email"]

def test_deposit_and_transfer():
    # Login
    login = client.post("/auth/login", json={"email": REGISTER_DATA["email"], "password": REGISTER_DATA["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    account = login.json()["user"]["account_number"]

    # Deposit
    r = client.post("/transactions/deposit", json={"amount": 1000}, headers=headers)
    assert r.status_code == 201
    assert float(r.json()["amount"]) == 1000.0

    # Register second user
    r2 = client.post("/auth/register", json={
        "full_name": "Test Receiver",
        "email": "receiver@test.com",
        "password": "securepass123",
    })
    receiver_account = r2.json()["user"]["account_number"]

    # Transfer
    r3 = client.post("/transactions/transfer", json={
        "receiver_account": receiver_account,
        "amount": 250,
        "description": "Test transfer",
    }, headers=headers)
    assert r3.status_code == 201
    assert float(r3.json()["amount"]) == 250.0

def test_transaction_history():
    login = client.post("/auth/login", json={"email": REGISTER_DATA["email"], "password": REGISTER_DATA["password"]})
    token = login.json()["access_token"]
    r = client.get("/transactions/history", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert "items" in r.json()
