# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**A-ERP** — Agentic Enterprise Resource Platform. Modular ERP with PMS (Project Management), WMS (Warehouse), HRM (Human Resources), CRM (Customer Relations), Agent orchestration, and MCP protocol layers.
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
backend/
  app/
    api/v1/routers/       # shared HTTP layer (auth, health, workspaces, teams, notifications, sse, agents)
    models/               # shared models only (user, workspace, team, token)
    schemas/              # shared schemas only (auth, workspace, team)
    services/             # shared services (auth, workspace, notifications)
    dependencies/         # shared Depends() (auth, workspace RBAC, db)
    core/                 # config, database, security
    worker/               # ARQ background jobs
    modules/
      pms/                # Project Management (routers, services, models, schemas, dependencies)
      wms/                # Warehouse Management (routers, services, models, schemas)
      hrm/                # Human Resource Management (routers, services, models, schemas)
      crm/                # Customer Relationship Management (routers, services, models, schemas)
    agents/               # Agent layer (base, registry, orchestrator, per-domain stubs)
    mcp/                  # MCP protocol (envelope, bus, context, policy)
frontend/
  src/
    shared/               # lib, components (ui + shell), stores
    features/             # shared features (auth, notifications, search, settings, workspaces)
    modules/
      pms/features/       # PMS pages (dashboard, projects, tasks, goals, custom-fields)
      wms/features/       # WMS placeholder pages
      hrm/features/       # HRM placeholder pages
      crm/features/       # CRM placeholder pages
    stores/               # Zustand (auth, workspace, module)
    app/                  # App.tsx, router.tsx
docker-compose.yml        # PostgreSQL 15 + Redis 7
Makefile
```

## API URL Patterns

- Shared routes: `/api/v1/auth/...`, `/api/v1/workspaces/...`, `/api/v1/teams/...`
- PMS routes: `/api/v1/pms/projects/...`, `/api/v1/pms/tasks/...`
- WMS routes: `/api/v1/wms/warehouses/...`, `/api/v1/wms/inventory/...`
- HRM routes: `/api/v1/hrm/departments/...`, `/api/v1/hrm/employees/...`
- CRM routes: `/api/v1/crm/contacts/...`, `/api/v1/crm/deals/...`
- Agents: `POST /api/v1/agents/{module}/invoke`

## Key Patterns

- **Auth:** JWT access token (in memory, NOT localStorage) + refresh token (HttpOnly cookie)
- **Real-time:** SSE + PostgreSQL LISTEN/NOTIFY (channel per workspace)
- **RBAC:** workspace roles (admin/member/guest) + project roles (owner/editor/commenter/viewer)
- **Modules:** each module has its own routers, services, models, schemas under `modules/{mod}/`
- **Agents:** abstract BaseAgent → domain stubs → AgentOrchestrator for cross-module routing
- **MCP:** MCPEnvelope protocol with in-process event bus, shared context, and policy/audit
- **Drag-drop position:** float "fractional indexing" — new position = (prev + next) / 2
- **FTS:** PostgreSQL tsvector trigger on task title+description
- **State:** Zustand (global auth/workspace/module) + TanStack Query v5 (server state)
- **File size limit:** keep files ≤200 lines, split at logical boundaries
- **Naming:** kebab-case, long descriptive names

## Environment

Copy `.env.example` → `backend/.env` before running. Never commit `.env`.

## Docs

- `docs/tech-stack.md` — full technology decisions
- `docs/system-architecture.md` — system architecture
- `docs/design-guidelines.md` — colors, typography, spacing
- `docs/wireframe/` — HTML wireframes for all views
- `plans/` — implementation phase files
