# 🏦 FinanceOS — Full Stack Banking App

A production-grade banking & financial transaction system built with FastAPI + React.

## Features

- **JWT Authentication** — Register, login, access & refresh tokens
- **Money Transfers** — Send money between accounts with real-time balance updates
- **Deposit & Withdraw** — Full transaction lifecycle with audit trail
- **Dashboard** — Balance overview, summary cards, monthly bar charts (Recharts)
- **Transaction History** — Paginated, filterable, searchable history
- **Pandas Analytics** — Server-side financial summaries using Pandas aggregation
- **Docker** — Full local dev environment with one command
- **CI/CD** — GitHub Actions pipeline: test → build → deploy

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Backend    | FastAPI · Python 3.12 · SQLAlchemy ORM        |
| Database   | PostgreSQL 16                                 |
| Auth       | JWT (python-jose) · bcrypt (passlib)          |
| Analytics  | Pandas · NumPy                                |
| Frontend   | React 18 · TypeScript · React Router v6       |
| Charts     | Recharts                                      |
| HTTP       | Axios with interceptors                       |
| DevOps     | Docker · Docker Compose · GitHub Actions      |

## Project Structure

```
bankapp/
├── backend/
│   ├── app/
│   │   ├── core/           # config, database, security, deps
│   │   ├── models/         # SQLAlchemy: User, Transaction
│   │   ├── schemas/        # Pydantic: auth, transaction
│   │   ├── routers/        # FastAPI routes: auth, transactions, users
│   │   └── services/       # Business logic: auth_service, transaction_service
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── components/     # Layout, Sidebar
│       ├── pages/          # Dashboard, Login, Register, Transfer, Transactions
│       ├── hooks/          # useAuth (React Context)
│       ├── services/       # Axios API instance
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Currency & date formatters
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick Start

### With Docker (recommended)

```bash
git clone <your-repo>
cd bankapp
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs

### Without Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL in .env to your local Postgres
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint                      | Auth | Description                  |
|--------|-------------------------------|------|------------------------------|
| POST   | /auth/register                | No   | Register new user            |
| POST   | /auth/login                   | No   | Login, get JWT tokens        |
| POST   | /auth/refresh                 | No   | Refresh access token         |
| GET    | /auth/me                      | Yes  | Get current user profile     |
| POST   | /transactions/transfer        | Yes  | Transfer money               |
| POST   | /transactions/deposit         | Yes  | Deposit to own account       |
| POST   | /transactions/withdraw        | Yes  | Withdraw from own account    |
| GET    | /transactions/history         | Yes  | Paginated + filtered history |
| GET    | /transactions/summary         | Yes  | Pandas financial summary     |
| GET    | /transactions/chart/monthly   | Yes  | Monthly chart data           |
| GET    | /users/lookup?account_number= | Yes  | Look up account by number    |

## Running Tests

```bash
cd backend
pytest tests/ -v
```

## Built By

**Althaf Ahamed** — Full Stack Developer · Colombo, Sri Lanka
