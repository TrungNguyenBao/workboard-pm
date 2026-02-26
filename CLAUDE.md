# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**WorkBoard** — Full-featured project management app (Asana clone).
Stack: React 18 + FastAPI + PostgreSQL 15 + Redis 7.

## Commands

```bash
# Start everything (requires Docker)
make docker-up   # Start PostgreSQL + Redis
make dev         # Start backend (port 8000) + frontend (port 5173)

# Individually
make dev-backend    # FastAPI on :8000 with hot reload
make dev-frontend   # Vite on :5173 with HMR

# Database
make migrate        # alembic upgrade head
make migrate-create name="add_feature"  # new migration
make seed           # seed test data

# Testing
make test           # backend pytest + frontend vitest
make test-e2e       # Playwright E2E

# Code quality
make lint           # ruff + eslint
make format         # ruff format + prettier
```

## Architecture

```
workboard-pm/
  backend/          # FastAPI + Python 3.12 + uv
    app/
      api/v1/routers/     # thin HTTP layer
      services/           # business logic
      models/             # SQLAlchemy 2.0 async models
      schemas/            # Pydantic v2 request/response
      dependencies/       # FastAPI Depends() (auth, RBAC, db)
      core/               # config, database, security
      worker/             # ARQ background jobs
  frontend/         # React 18 + TypeScript + Vite
    src/
      features/           # feature-based folders (tasks, projects, auth, ...)
      shared/             # lib, components (shadcn wrappers), stores
      app/                # App.tsx, router.tsx
  docker-compose.yml  # PostgreSQL 15 + Redis 7
  Makefile
```

## Key Patterns

- **Auth:** JWT access token (in memory, NOT localStorage) + refresh token (HttpOnly cookie)
- **Real-time:** SSE + PostgreSQL LISTEN/NOTIFY (channel per workspace)
- **RBAC:** workspace roles (admin/member/guest) + project roles (owner/editor/commenter/viewer)
- **Drag-drop position:** float "fractional indexing" — new position = (prev + next) / 2
- **FTS:** PostgreSQL tsvector trigger on task title+description
- **State:** Zustand (global auth/workspace) + TanStack Query v5 (server state)
- **File size limit:** keep files ≤200 lines, split at logical boundaries
- **Naming:** kebab-case, long descriptive names

## Environment

Copy `.env.example` → `backend/.env` before running. Never commit `.env`.

## Docs

- `docs/tech-stack.md` — full technology decisions
- `docs/design-guidelines.md` — colors, typography, spacing
- `docs/wireframe/` — HTML wireframes for all views
- `plans/` — implementation phase files
