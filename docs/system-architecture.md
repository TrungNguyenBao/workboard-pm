# A-ERP — System Architecture

**Last updated:** 2026-03-02

---

## High-Level Overview

```
Browser (React 18 + Vite)
        │  REST + SSE
        ▼
FastAPI (Python 3.12)
        │
        ├── Module routers  (/pms, /wms, /hrm, /crm)
        ├── Agent layer      (BaseAgent → domain stubs → orchestrator)
        ├── MCP protocol     (envelope, bus, context, policy)
        ├── PostgreSQL 15    (primary store, FTS, LISTEN/NOTIFY path available)
        ├── Redis 7          (ARQ background jobs, session cache)
        └── File storage     (local disk dev → MinIO/S3 prod)
```

All components run via Docker Compose in development. The SSE broker is in-process (no PostgreSQL LISTEN/NOTIFY in use yet; Redis Pub/Sub is the planned upgrade path for multi-instance).

---

## Directory Structure

```
backend/
  app/
    api/v1/
      router.py          # aggregates shared + module routers
      routers/           # shared: auth, health, workspaces, teams, notifications, sse, agents
    models/              # shared only: user, workspace, team, token, base, enums
    schemas/             # shared only: auth, workspace, team
    services/            # shared: auth, workspace, notifications
    dependencies/        # shared: auth, workspace RBAC, db session
    core/                # config, database engine, security utilities
    worker/              # ARQ background job definitions
    modules/
      pms/               # Project Management System
        routers/         # projects, sections, tasks, comments, attachments, tags, custom_fields, goals, activity
        services/        # task, project, comment, attachment, activity_log, recurring_tasks, custom_field, goal
        models/          # project, task, comment, attachment, tag, notification, activity_log, custom_field, goal
        schemas/         # project, task, comment, attachment, notification, activity_log, custom_field, goal
        dependencies/    # project-level RBAC (require_project_role)
        router.py        # aggregates PMS routers under /pms prefix
      wms/               # Warehouse Management System
        routers/         # warehouses, products, devices, suppliers, inventory_items
        services/        # warehouse, product, device, supplier, inventory_item
        models/          # warehouse, product, device, supplier, inventory_item
        schemas/         # warehouse, product, device, supplier, inventory_item, pagination
        router.py        # aggregates WMS routers under /wms prefix
      hrm/               # Human Resource Management
        routers/         # departments, employees
        services/        # department, employee
        models/          # department, employee
        schemas/         # department, employee
        router.py        # aggregates HRM routers under /hrm prefix
      crm/               # Customer Relationship Management
        routers/         # contacts, deals
        services/        # contact, deal
        models/          # contact, deal
        schemas/         # contact, deal
        router.py        # aggregates CRM routers under /crm prefix
    agents/              # Agent orchestration layer
      base.py            # abstract BaseAgent ABC
      registry.py        # agent registration + lookup
      orchestrator.py    # cross-module routing
      {pms,wms,hrm,crm}_agent.py  # domain agent stubs
    mcp/                 # Model Context Protocol layer
      protocol.py        # MCPEnvelope Pydantic model
      bus.py             # in-process pub/sub event bus
      context.py         # shared context key-value store
      policy.py          # governance rules + audit log
  alembic/               # migration versions
frontend/
  src/
    shared/
      components/
        shell/           # app-shell, sidebar, header, module-switcher, keyboard-shortcuts
        ui/              # shadcn component wrappers
      lib/               # api, query-client, utils
    features/            # shared: auth, notifications, search, settings, workspaces
    modules/
      pms/features/      # dashboard, projects, tasks, goals, custom-fields
      wms/features/      # warehouses, products, devices, suppliers, inventory; shared components (data-table, page-header, pagination)
      hrm/features/      # employees, departments (placeholder)
      crm/features/      # contacts, deals (placeholder)
    stores/              # Zustand: auth, workspace, module
    app/                 # App.tsx, router.tsx
docker-compose.yml
Makefile
```

---

## Backend Layer Responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| Router (shared) | `api/v1/routers/` | Shared HTTP endpoints: auth, health, workspaces, teams, notifications, SSE, agents |
| Router (module) | `modules/{mod}/routers/` | Module-specific HTTP endpoints, prefixed with `/{mod}` |
| Service (shared) | `services/` | Auth, workspace, SSE publish |
| Service (module) | `modules/{mod}/services/` | Module-specific business logic, DB mutations |
| Model (shared) | `models/` | Shared tables: user, workspace, team, token |
| Model (module) | `modules/{mod}/models/` | Module-specific tables |
| Schema | `schemas/` + `modules/{mod}/schemas/` | Pydantic request/response shapes |
| Dependency | `dependencies/` + `modules/{mod}/dependencies/` | Reusable `Depends()` — auth, RBAC |
| Core | `core/` | App config (`settings`), async DB engine, JWT/password helpers |
| Worker | `worker/` | ARQ async tasks (email, scheduled jobs) |
| Agent | `agents/` | Domain agent stubs with capabilities, orchestrator for cross-module routing |
| MCP | `mcp/` | Inter-module communication protocol with audit |

### Pagination Pattern

WMS endpoints use a **generic `PaginatedResponse`** schema for list operations:

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

Used in routers like `GET /wms/products?limit=20&offset=0` → returns `PaginatedResponse[ProductResponse]`.
This pattern is reusable across all modules for consistent list APIs.

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

### WMS Tables

| Table | Key Columns | Notes |
|---|---|---|
| `warehouses` | `id`, `name`, `location`, `workspace_id`, `is_active` | Workspace-scoped |
| `wms_products` | `id`, `sku`, `name`, `description`, `unit_price`, `workspace_id` | Workspace-scoped |
| `wms_devices` | `id`, `device_id`, `device_type`, `location`, `status`, `workspace_id` | Workspace-scoped; track physical devices |
| `wms_suppliers` | `id`, `name`, `email`, `phone`, `address`, `workspace_id` | Workspace-scoped supplier registry |
| `inventory_items` | `id`, `sku`, `name`, `quantity`, `unit`, `warehouse_id`, `workspace_id` | FK to warehouse |

### HRM Tables

| Table | Key Columns | Notes |
|---|---|---|
| `departments` | `id`, `name`, `description`, `workspace_id` | Workspace-scoped |
| `employees` | `id`, `user_id`, `name`, `email`, `department_id`, `position`, `hire_date`, `workspace_id` | Optional FK to user |

### CRM Tables

| Table | Key Columns | Notes |
|---|---|---|
| `contacts` | `id`, `name`, `email`, `phone`, `company`, `workspace_id` | Workspace-scoped |
| `deals` | `id`, `title`, `value`, `stage`, `contact_id`, `workspace_id` | FK to contact |

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
| Server state (tasks, projects, users) | TanStack Query v5 | `modules/*/features/*/hooks/` + `features/*/hooks/` |
| Global auth + active workspace | Zustand | `stores/auth.store.ts`, `stores/workspace.store.ts` |
| Active module tracking | Zustand | `stores/module.store.ts` |
| Form state | React Hook Form + Zod | inline per form component |

### UI & Interaction Libraries

| Component | Library | Usage |
|---|---|---|
| Drag-and-drop | `@dnd-kit` (core, sortable, utilities) | Board view: reorder tasks between/within columns using fractional indexing |
| Component library | shadcn/ui (Radix UI primitives) | Buttons, modals, dropdowns, tabs, toast, tooltips |
| Icons | lucide-react | UI icon set |
| CSS utilities | Tailwind CSS | Styling with `tailwindcss-animate` for transitions |

**Board View Implementation:**
- `board.tsx` orchestrates the kanban layout and drag handlers.
- `board-task-card.tsx` — individual draggable task card with drag handle.
- `board-kanban-column.tsx` — drop zone for each column; handles empty-column drops.
- `board-add-section-input.tsx` — new section creation UI.
- Collision detection: `closestCorners` strategy for better visual feedback.
- Position calculation: fractional indexing (new position = (prev + next) / 2) prevents conflicts during concurrent moves.
- Optimistic updates in `useMoveTask` hook (TanStack Query `onMutate`/`onError`/`onSettled`) for instant visual feedback.

### Feature Structure

Shared features live under `frontend/src/features/`. Module-specific features live under `frontend/src/modules/{mod}/features/`:

```
modules/pms/features/{name}/   # or features/{name}/ for shared
  components/   # presentational + container components
  hooks/        # TanStack Query hooks (useQuery, useMutation)
  pages/        # route-level page components
  tests/        # vitest unit + component tests
```

### Route Structure

Routes are module-prefixed: `/pms/my-tasks`, `/pms/projects/:id/board`, `/wms`, `/hrm`, `/crm`.
A module switcher component in the shell allows navigation between modules.

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
