# WorkBoard

A full-featured project management app — Asana clone built with React + FastAPI + PostgreSQL.

![Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql) ![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)

## Features

- **Kanban board** — drag-and-drop tasks across sections (dnd-kit, fractional indexing)
- **List & Calendar views** — multiple ways to visualize project work
- **Task detail drawer** — inline editing, rich comments, subtasks, attachments, priority, due dates
- **Real-time updates** — Server-Sent Events per workspace; live task + notification push
- **Auth** — JWT access tokens (in-memory) + HttpOnly refresh tokens (30-day, family invalidation)
- **RBAC** — workspace roles (admin / member / guest) × project roles (owner / editor / commenter / viewer)
- **Full-text search** — PostgreSQL `tsvector` + GIN index on task title & description
- **Notifications** — bell with unread badge, mark-read API, SSE-triggered invalidation
- **Command palette** — ⌘K search across projects and navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State | Zustand v5, TanStack Query v5 |
| Routing | React Router v7 |
| UI | Radix UI primitives, shadcn/ui components |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7, ARQ |
| Auth | PyJWT, bcrypt, HttpOnly cookies |
| Migrations | Alembic |
| Testing | pytest-asyncio, Vitest, Testing Library, Playwright |

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [uv](https://docs.astral.sh/uv/) — Python package manager
- [Node.js](https://nodejs.org/) 18+

### Setup

```bash
git clone https://github.com/TrungNguyenBao/workboard-pm
cd workboard-pm

# Install dependencies
make install

# Copy env file
cp .env.example backend/.env
```

### Run

```bash
# 1. Start PostgreSQL + Redis
make docker-up

# 2. Apply database migrations
make migrate

# 3. Start backend (:8000) + frontend (:5173)
make dev
```

Open **http://localhost:5173** — register an account, create a workspace, and start managing projects.

API docs available at **http://localhost:8000/api/docs** (development only).

## Project Structure

```
workboard-pm/
├── backend/
│   ├── app/
│   │   ├── api/v1/routers/   # HTTP endpoints (thin layer)
│   │   ├── services/         # Business logic
│   │   ├── models/           # SQLAlchemy 2.0 async models
│   │   ├── schemas/          # Pydantic v2 request/response
│   │   ├── dependencies/     # FastAPI Depends() — auth, RBAC, db
│   │   ├── core/             # Config, database, security
│   │   └── worker/           # ARQ background jobs
│   ├── alembic/              # Migrations
│   └── tests/                # pytest
└── frontend/
    └── src/
        ├── app/              # Router, App bootstrap
        ├── features/         # auth, projects, tasks, dashboard, …
        ├── shared/           # UI components, API client, stores
        └── stores/           # Zustand global state
```

## Available Commands

```bash
make docker-up        # Start PostgreSQL + Redis
make docker-down      # Stop containers
make migrate          # Run Alembic migrations
make dev              # Start backend + frontend (hot reload)
make dev-backend      # Backend only  — http://localhost:8000
make dev-frontend     # Frontend only — http://localhost:5173
make test             # Backend pytest + frontend Vitest
make test-e2e         # Playwright E2E tests
make lint             # ruff + eslint
make format           # ruff format + prettier
make seed             # Seed demo data
```

## API Overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register + receive tokens |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token |
| `GET` | `/api/v1/auth/me` | Current user |
| `GET/POST` | `/api/v1/workspaces` | List / create workspaces |
| `GET/POST` | `/api/v1/workspaces/{id}/projects` | List / create projects |
| `GET/POST` | `/api/v1/projects/{id}/tasks` | List / create tasks |
| `PATCH` | `/api/v1/projects/{id}/tasks/{id}/move` | Drag-and-drop reorder |
| `GET` | `/api/v1/projects/{id}/tasks/search?q=` | Full-text search |
| `GET` | `/api/v1/workspaces/{id}/sse` | SSE event stream |
| `GET` | `/api/v1/notifications` | List notifications |

Full interactive docs: `http://localhost:8000/api/docs`

## License

MIT
