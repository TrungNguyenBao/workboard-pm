# WorkBoard — System Architecture

**Last updated:** 2026-02-27

---

## High-Level Overview

```
Browser (React 18 + Vite)
        │  REST + SSE
        ▼
FastAPI (Python 3.12)
        │
        ├── PostgreSQL 15  (primary store, FTS, LISTEN/NOTIFY path available)
        ├── Redis 7         (ARQ background jobs, session cache)
        └── File storage    (local disk dev → MinIO/S3 prod)
```

All components run via Docker Compose in development. The SSE broker is in-process (no PostgreSQL LISTEN/NOTIFY in use yet; Redis Pub/Sub is the planned upgrade path for multi-instance).

---

## Directory Structure

```
workboard-pm/
  backend/
    app/
      api/v1/routers/   # thin HTTP layer — validate, auth, delegate to service
      services/         # business logic, DB writes, SSE publish
      models/           # SQLAlchemy 2.0 async ORM models
      schemas/          # Pydantic v2 request/response types
      dependencies/     # FastAPI Depends() — auth, RBAC, db session
      core/             # config, database engine, security utilities
      worker/           # ARQ background job definitions
    alembic/            # migration versions
  frontend/
    src/
      features/         # feature-based folders (auth, projects, tasks, …)
      shared/           # lib utilities, shadcn component wrappers, Zustand stores
      app/              # App.tsx, router.tsx
  docker-compose.yml
  Makefile
```

---

## Backend Layer Responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| Router | `api/v1/routers/` | Parse HTTP request, run auth/RBAC deps, call service, return response |
| Service | `services/` | Business logic, DB mutations, SSE publish, notification creation |
| Model | `models/` | SQLAlchemy table definitions, relationships |
| Schema | `schemas/` | Pydantic request/response shapes, field validation |
| Dependency | `dependencies/` | Reusable `Depends()` — current user, RBAC role check, DB session |
| Core | `core/` | App config (`settings`), async DB engine, JWT/password helpers |
| Worker | `worker/` | ARQ async tasks (email, scheduled jobs) |

---

## Data Model

### Core Tables

| Table | Key Columns | Notes |
|---|---|---|
| `users` | `id`, `email`, `name`, `avatar_url`, `hashed_password` | bcrypt passwords |
| `workspaces` | `id`, `name`, `slug` | Top-level tenancy boundary |
| `workspace_members` | `workspace_id`, `user_id`, `role` | Roles: admin / member / guest |
| `teams` | `id`, `workspace_id`, `name` | Optional sub-groups within a workspace |
| `projects` | `id`, `workspace_id`, `name`, `visibility` | Visibility: private / team / public |
| `project_members` | `project_id`, `user_id`, `role` | Roles: owner / editor / commenter / viewer |
| `sections` | `id`, `project_id`, `name`, `position` | Kanban columns / list sections |
| `tasks` | `id`, `project_id`, `section_id`, `assignee_id`, `title`, `status`, `priority`, `position`, `due_date`, `search_vector` | Soft delete; fractional index position |
| `task_dependencies` | `blocking_task_id`, `blocked_task_id` | Unique constraint |
| `task_followers` | `task_id`, `user_id` | Subscribe to task events |
| `task_tags` | `task_id`, `tag_id` | Junction |
| `tags` | `id`, `workspace_id`, `name`, `color` | Workspace-scoped |
| `comments` | `id`, `task_id`, `author_id`, `body` | Rich text |
| `attachments` | `id`, `task_id`, `filename`, `url`, `size` | File uploads |
| `notifications` | `id`, `user_id`, `actor_id`, `type`, `title`, `is_read` | Typed enum |
| `activity_logs` | `id`, `workspace_id`, `project_id`, `entity_type`, `entity_id`, `actor_id`, `action`, `changes` | JSONB change tracking; cursor-paginated |
| `refresh_tokens` | `id`, `user_id`, `token_hash`, `expires_at` | HttpOnly cookie strategy |

### Key Indexes

| Index | Table | Purpose |
|---|---|---|
| `ix_tasks_search_vector` (GIN) | `tasks` | Full-text search |
| `ix_tasks_project_position` | `tasks` | Ordered list/board queries |
| `ix_tasks_section_position` | `tasks` | Section-scoped ordering |
| `ix_activity_logs_entity` | `activity_logs` | `(entity_type, entity_id)` — task history |
| `ix_activity_logs_created_at` | `activity_logs` | Cursor pagination |

---

## Authentication Flow

```
Login → POST /auth/login
  → returns: access_token (JSON body, stored in memory)
             refresh_token (HttpOnly cookie, 30-day expiry)

Authenticated request:
  Authorization: Bearer <access_token>

Token refresh → POST /auth/refresh
  → reads HttpOnly cookie
  → returns new access_token
```

- Access token: short-lived JWT, never written to `localStorage`.
- Refresh token: stored as `HttpOnly` cookie; hash stored in `refresh_tokens` table.
- Passwords: bcrypt via `passlib`.

---

## RBAC Model

Two independent role dimensions applied per request:

| Dimension | Roles (low → high) | Checked via |
|---|---|---|
| Workspace | guest → member → admin | `require_workspace_role()` dependency |
| Project | viewer → commenter → editor → owner | `require_project_role()` dependency |

`require_project_role("viewer")` is the minimum gate for all activity endpoints.

---

## Real-time (SSE)

```
Client                         Server
  │── GET /sse?workspace_id ──▶ SSE endpoint subscribes queue
  │◀── event: stream ──────────
  │                             Any service calls publish(workspace_id, event)
  │◀── data: {"type": ...} ─── queue delivers to all subscribers
```

- Broker: in-process `dict[workspace_id → set[asyncio.Queue]]` in `services/notifications.py`.
- Each workspace has isolated subscriber sets.
- Slow consumers: events dropped when queue is full (maxsize=100), no back-pressure.
- SSE event types currently published: `notification`, `activity_created`.
- Frontend handler: `use-sse.ts` dispatches events to TanStack Query invalidation.
- Upgrade path: Redis Pub/Sub when running multiple backend instances.

---

## Activity Log

The activity log is a append-only audit trail for workspace events.

### Write Path

```
service function (task / comment / project)
  └── create_activity(db, workspace_id, project_id, entity_type, entity_id,
                       actor_id, action, changes)
        ├── INSERT INTO activity_logs
        └── publish(workspace_id, {type: "activity_created", ...})
```

`changes` is a free-form JSONB dict. Convention used by task service: `{"field": {"old": ..., "new": ...}}` for update events.

### Read Path

```
GET /projects/{project_id}/activity?limit=50&cursor=<uuid>
GET /projects/{project_id}/tasks/{task_id}/activity?limit=20

list_activity(db, project_id | entity_type + entity_id, limit, cursor)
  └── SELECT … ORDER BY created_at DESC LIMIT n
      (cursor: WHERE created_at < cursor_entry.created_at)
```

Response shape (`ActivityLogResponse`):

| Field | Type | Source |
|---|---|---|
| `id` | `UUID` | `activity_logs.id` |
| `entity_type` | `str` | e.g. `"task"`, `"project"`, `"comment"` |
| `entity_id` | `UUID` | |
| `action` | `str` | e.g. `"created"`, `"updated"`, `"deleted"` |
| `changes` | `dict \| null` | JSONB field |
| `actor_name` | `str` | Eagerly loaded via `selectinload(ActivityLog.actor)` |
| `actor_avatar_url` | `str \| null` | |
| `created_at` | `datetime` | |

---

## Frontend Architecture

### State Management

| Concern | Tool | Location |
|---|---|---|
| Server state (tasks, projects, users) | TanStack Query v5 | `features/*/hooks/` |
| Global auth + active workspace | Zustand | `shared/stores/` |
| Form state | React Hook Form + Zod | inline per form component |

### Feature Structure

Each feature folder under `frontend/src/features/` follows:

```
features/{name}/
  components/   # presentational + container components
  hooks/        # TanStack Query hooks (useQuery, useMutation)
  pages/        # route-level page components
  tests/        # vitest unit + component tests
```

### Real-time Integration

`shared/hooks/use-sse.ts` maintains a single `EventSource` per authenticated session. On `activity_created` events it calls `queryClient.invalidateQueries` for the relevant project/task activity keys. On `notification` events it invalidates the notification list query.

---

## Background Jobs (ARQ)

ARQ workers connect to Redis and process async tasks:
- Defined in `backend/app/worker/`.
- Enqueued via `arq.create_pool()` from service layer.
- Current use: email delivery, scheduled due-date reminders.

---

## Search

Full-text search is PostgreSQL-native:
- A database trigger maintains `tasks.search_vector` (tsvector) from `title || description`.
- GIN index `ix_tasks_search_vector` enables fast `@@` queries.
- Upgrade path: Meilisearch for cross-entity search in a later phase.
