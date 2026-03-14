# A-ERP — System Architecture

**Last updated:** 2026-03-14

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
    schemas/             # shared only: auth, workspace, team, pagination
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
        schemas/         # warehouse, product, device, supplier, inventory_item
        router.py        # aggregates WMS routers under /wms prefix
      hrm/               # Human Resource Management
        routers/         # departments, employees, leave_requests, payroll_records
        services/        # department, employee, leave_request, payroll_record
        models/          # department, employee, leave_type, leave_request, payroll_record
        schemas/         # department, employee, leave_request, payroll_record
        router.py        # aggregates HRM routers under /hrm prefix
      crm/               # Customer Relationship Management
        routers/         # contacts, deals, products, contracts, quotations, custom_fields, email_templates, attachments, forecasts, import_export, deal_contacts, deal_competitors, workflows
        services/        # contact, deal, account, lead, product, contract, quotation, notification, attachment, custom_field, email, competitor, forecast, import_job, workflows, data_quality, governance
        models/          # 21 total: contact, deal, account, lead, activity, ticket, campaign, activity_note, product_service, contract, quotation, quotation_line, crm_notification, crm_attachment, deal_contact_role, crm_custom_field, email_template, email_log, competitor, sales_forecast, import_job
        schemas/         # contact, deal, account, lead, custom_field, email_template, quotation, notification, etc.
        dependencies/    # CRM RBAC (admin/sales_manager/sales/marketing/support with entity-level permissions)
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
      hrm/features/      # departments, employees, leave requests, payroll records; shared components (data-table, page-header, pagination)
      crm/features/      # contacts, deals (shared: data-table, page-header, pagination)
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

All modules use a **generic `PaginatedResponse`** schema for list operations:

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

Used in routers like `GET /wms/products?limit=20&offset=0` → returns `PaginatedResponse[ProductResponse]`.
Located in `app/schemas/pagination.py` for reuse across WMS, HRM, CRM modules.

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
| `departments` | `id`, `name`, `description`, `workspace_id`, `created_at`, `updated_at` | Workspace-scoped |
| `employees` | `id`, `name`, `email`, `position`, `hire_date`, `department_id`, `workspace_id`, `created_at`, `updated_at` | FK to department (nullable); optional FK to user; ILIKE search on name/email |
| `leave_types` | `id`, `name`, `description`, `workspace_id`, `created_at` | Define leave categories (vacation, sick, etc.) |
| `leave_requests` | `id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `status` ('pending'/'approved'/'rejected'), `workspace_id`, `created_at`, `updated_at` | Admin approval workflow; cascade delete with employee |
| `payroll_records` | `id`, `employee_id`, `month`, `salary`, `deductions`, `bonus`, `workspace_id`, `created_at`, `updated_at` | Store-only; no auto-calc; cascade delete with employee |

### CRM Tables (21 Models Total)

| Table | Key Columns | Notes |
|---|---|---|
| `contacts` | `id`, `name`, `email`, `phone`, `company`, `workspace_id`, `created_at`, `updated_at` | Workspace-scoped; EmailStr validation; ILIKE search on name/email/company |
| `deals` | `id`, `title`, `value`, `stage`, `contact_id`, `owner_id`, `last_activity_date`, `created_at`, `updated_at` | FK to contact (nullable); stage default='lead'; workspace-scoped filtering |
| `accounts` | `id`, `name`, `industry`, `total_revenue`, `health_score`, `workspace_id`, `created_at`, `updated_at` | Portfolio of contacts; auto-aggregated revenue from won deals |
| `leads` | `id`, `name`, `email`, `phone`, `score`, `status`, `owner_id`, `last_activity_date`, `workspace_id` | Lead scoring (0-100); dual-mode (initial + interaction-based); status flow: prospect→qualified→contacted→proposal→negotiation→won/lost |
| `contacts_contact_roles` | `deal_id`, `contact_id`, `role`, `created_at` | Junction: multi-contact per deal with roles (decision_maker/influencer/champion/user/evaluator) |
| `products_services` | `id`, `name`, `type`, `price`, `workspace_id`, `created_at`, `updated_at` | Catalog: product/service/bundle with pricing |
| `contracts` | `id`, `deal_id`, `start_date`, `end_date`, `value`, `status`, `workspace_id`, `created_at`, `updated_at` | Lifecycle: draft→active→expired/terminated; auto-created on Close Won |
| `quotations` | `id`, `deal_id`, `total_amount`, `discount`, `status`, `workspace_id`, `created_at`, `updated_at` | Draft→sent→accepted/rejected/expired; accept syncs deal.value; >20% discount triggers advisory |
| `quotation_lines` | `id`, `quotation_id`, `product_service_id`, `quantity`, `unit_price`, `subtotal` | Child lines with auto-calculated totals |
| `crm_notifications` | `id`, `entity_type`, `entity_id`, `user_id`, `type`, `is_read`, `workspace_id`, `created_at` | In-app notifications: triggered on lead assign + deal stage change |
| `crm_attachments` | `id`, `entity_type`, `entity_id`, `filename`, `url`, `size`, `uploaded_by`, `workspace_id`, `created_at` | File uploads per entity (deal/account/contact/lead/ticket/contract) |
| `crm_custom_fields` | `id`, `entity_type`, `field_name`, `field_type`, `metadata`, `workspace_id`, `created_at` | JSONB storage; types: text/number/date/select/multi_select |
| `email_templates` | `id`, `name`, `subject`, `body`, `merge_tags`, `workspace_id`, `created_at`, `updated_at` | Templates with merge tags (e.g., {{contact.name}}) |
| `email_logs` | `id`, `template_id`, `recipient`, `sent_at`, `opened_at`, `clicked_at`, `workspace_id` | Tracking: open/click metrics |
| `competitors` | `id`, `deal_id`, `name`, `strengths`, `weaknesses`, `price_comparison`, `workspace_id`, `created_at` | Per-deal competitor tracking with metadata |
| `sales_forecasts` | `id`, `period_start`, `period_end`, `target`, `actual`, `attainment_pct`, `workspace_id`, `created_at` | Period-based targets vs actual with attainment % |
| `import_jobs` | `id`, `entity_type`, `filename`, `status`, `total_rows`, `error_rows`, `workspace_id`, `created_at` | CSV import with duplicate detection + error logging |
| `activities` | `id`, `entity_id`, `entity_type`, `type`, `notes`, `created_at` | Track interactions (email/call/demo/meeting/note) |
| `activity_notes` | `id`, `activity_id`, `text`, `created_by`, `created_at` | Structured notes per activity |
| `tickets` | `id`, `contact_id`, `subject`, `status`, `priority`, `reopen_count`, `resolved_at`, `workspace_id`, `created_at` | Support tickets with reopen tracking |
| `campaigns` | `id`, `name`, `status`, `budget`, `cost_per_lead`, `roi_pct`, `workspace_id`, `created_at`, `updated_at` | Marketing campaigns with ROI metrics |

### PMS Agile/Kanban Extensions

| Table | New/Modified Columns | Notes |
|---|---|---|
| `projects` | `project_type` (VARCHAR default 'kanban') | Type selector: 'basic' (list/calendar/timeline), 'kanban' (board), 'agile' (sprints/backlog) |
| `sections` | `wip_limit` (INT nullable) | Work-in-progress limit per column for Kanban boards |
| `tasks` | `sprint_id` (FK sprints.id, nullable), `epic_id` (FK tasks.id, nullable), `story_points` (INT nullable), `task_type` (VARCHAR default 'task') | Agile fields: sprint assignment, epic grouping, estimation, classification (task/story/bug/epic) |
| `sprints` | `id`, `project_id` (FK), `name`, `goal`, `start_date`, `end_date`, `status` (planning/active/completed), `created_by_id` | Sprint lifecycle: planning → start → active → complete → completed |

**Indexes:**
- `ix_sprints_project_id` — efficient sprint list queries per project
- `ix_sprints_status` — filter by sprint status (active, completed)
- `ix_tasks_sprint_id` — board view: tasks by sprint
- `ix_tasks_epic_id` — epic grouping queries

**Constraints:**
- Only one active sprint per project (enforced in `start_sprint()` service)
- All new task agile fields nullable (backward compatibility)
- Soft delete on sprints (deleted_at) via SoftDeleteMixin

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

## HRM Module API

### Departments Endpoints

| Method | Endpoint | RBAC | Description |
|---|---|---|---|
| `POST` | `/hrm/workspaces/{workspace_id}/departments` | member+ | Create department |
| `GET` | `/hrm/workspaces/{workspace_id}/departments` | guest+ | List departments with pagination & ILIKE search (name/description) |
| `GET` | `/hrm/workspaces/{workspace_id}/departments/{dept_id}` | guest+ | Get department by id (404 if workspace mismatch) |
| `PATCH` | `/hrm/workspaces/{workspace_id}/departments/{dept_id}` | member+ | Update department fields |
| `DELETE` | `/hrm/workspaces/{workspace_id}/departments/{dept_id}` | admin+ | Delete department |

**Request/Response:**
- `DepartmentCreate`: `name` (required, 1-255 chars), `description` (optional)
- `DepartmentResponse`: includes `id`, `workspace_id`, `created_at`, `updated_at`
- List response: `PaginatedResponse[DepartmentResponse]` with `items`, `total`, `limit`, `offset`

### Employees Endpoints

| Method | Endpoint | RBAC | Description |
|---|---|---|---|
| `POST` | `/hrm/workspaces/{workspace_id}/employees` | member+ | Create employee |
| `GET` | `/hrm/workspaces/{workspace_id}/employees` | guest+ | List employees with pagination, department filter, ILIKE search (name/email) |
| `GET` | `/hrm/workspaces/{workspace_id}/employees/{emp_id}` | guest+ | Get employee by id (404 if workspace mismatch) |
| `PATCH` | `/hrm/workspaces/{workspace_id}/employees/{emp_id}` | member+ | Update employee fields |
| `DELETE` | `/hrm/workspaces/{workspace_id}/employees/{emp_id}` | admin+ | Delete employee (cascades leave requests, payroll records) |

**Request/Response:**
- `EmployeeCreate`: `name` (required), `email` (optional, EmailStr), `position` (optional), `hire_date` (optional, date), `department_id` (optional, UUID)
- `EmployeeResponse`: includes `id`, `workspace_id`, `department_id`, `created_at`, `updated_at`
- List response: `PaginatedResponse[EmployeeResponse]` with filtering by `department_id`, search by name/email

### Leave Request Endpoints

| Method | Endpoint | RBAC | Description |
|---|---|---|---|
| `POST` | `/hrm/workspaces/{workspace_id}/leave-requests` | member+ | Create leave request |
| `GET` | `/hrm/workspaces/{workspace_id}/leave-requests` | guest+ | List leave requests with pagination, status filter |
| `POST` | `/hrm/workspaces/{workspace_id}/leave-requests/{req_id}/approve` | admin+ | Approve leave request |
| `POST` | `/hrm/workspaces/{workspace_id}/leave-requests/{req_id}/reject` | admin+ | Reject leave request |
| `DELETE` | `/hrm/workspaces/{workspace_id}/leave-requests/{req_id}` | admin+ | Delete leave request |

**Request/Response:**
- `LeaveRequestCreate`: `employee_id` (required, UUID), `leave_type_id` (required, UUID), `start_date` (required, date), `end_date` (required, date; must be ≥ start_date)
- `LeaveRequestResponse`: includes `id`, `employee_id`, `leave_type_id`, `status` ('pending', 'approved', 'rejected'), `created_at`, `updated_at`

### Payroll Record Endpoints

| Method | Endpoint | RBAC | Description |
|---|---|---|---|
| `POST` | `/hrm/workspaces/{workspace_id}/payroll-records` | member+ | Create payroll record |
| `GET` | `/hrm/workspaces/{workspace_id}/payroll-records` | guest+ | List payroll records with pagination, employee filter |
| `GET` | `/hrm/workspaces/{workspace_id}/payroll-records/{rec_id}` | guest+ | Get payroll record by id (404 if workspace mismatch) |
| `PATCH` | `/hrm/workspaces/{workspace_id}/payroll-records/{rec_id}` | member+ | Update payroll record fields |
| `DELETE` | `/hrm/workspaces/{workspace_id}/payroll-records/{rec_id}` | admin+ | Delete payroll record |

**Request/Response:**
- `PayrollRecordCreate`: `employee_id` (required, UUID), `month` (required, YYYY-MM format), `salary` (float, default=0.0), `deductions` (float, default=0.0), `bonus` (float, default=0.0)
- `PayrollRecordResponse`: includes `id`, `employee_id`, `month`, `salary`, `deductions`, `bonus`, `workspace_id`, `created_at`, `updated_at`

### Frontend Integration

- **Shared components**: `hrm-data-table`, `hrm-page-header`, `hrm-pagination`
- **Routes**: `/hrm/departments`, `/hrm/employees`, `/hrm/leave`, `/hrm/payroll`; sidebar shows HRM nav when `activeModule === 'hrm'`
- **State**: TanStack Query v5 hooks (`useDepartments`, `useEmployees`, `useLeaveRequests`, `usePayrollRecords`) + Zustand workspace store
- **Search**: server-side ILIKE filtering + client-side pagination

---

## CRM Module — Advanced Workflows & Scoring (Phase 1-7 Implementation)

### Lead Scoring — Dual-Mode System

- **Initial Score:** Set on creation (cold=0, warm=30, hot=60)
- **Interaction-Based:** Auto-incremented on activities (email_open +5, click +10, form +15, call +15, demo +20, meeting +20, note +2)
- **Score Levels:** Cold ≤25, Warm 26-60, Hot >60; auto-capped at 100

### Health Score — Weighted Formula

Account health = Revenue (30%) + Recency (30%) + Ticket resolution (20%) + Pipeline (20%)

### Deal Operations

- **Auto-probability on stage:** Qualified 10%, Needs Analysis 25%, Proposal 50%, Negotiation 75%
- **Close Won:** Auto-creates Contract (draft); syncs deal.value to quotation
- **Close Lost:** Accepts competitor_id and loss_reason; tracked in activity
- **Reopen:** Converts closed deals to negotiation; supports tracking

### Stale Detection

- **Leads:** 30+ days without activity (Activity.lead_id most recent)
- **Deals:** 60d general | 30d high-value (>500M VND)

### CRM RBAC Model

| Role | Permissions |
|---|---|
| `admin` | All CRUD, settings, forecasts, import/export, governance alerts |
| `sales_manager` | Own team deals/leads, forecasts, pipeline config, analytics |
| `sales` | Own deals/leads, activities, quotes, contracts (assigned only) |
| `marketing` | Campaigns, leads (assigned), templates, analytics (read-only deals) |
| `support` | Tickets, contacts, account notes, ticket analytics |

### Core Workflows

| Workflow | Service | Key Operations |
|---|---|---|
| **Lead Management** | `lead_workflows.py` | Duplicate detection, auto-scoring, stale identification, round-robin distribution |
| **Deal Pipeline** | `deal_workflows.py` | Stage validation, stale alerts, close operations, reopen support |
| **Data Quality** | `data_quality.py` | Health assessment, missing fields, duplicates, stale records (0-100 score) |
| **Governance** | `governance.py` | Policy alerts, compliance audit, audit trail tracking |

### CRM New Features (Phases 1-7)

| Feature | Details |
|---|---|
| **Quotation System** | Draft→sent→accepted/rejected/expired; auto-calculated line items; accept syncs deal.value |
| **Custom Fields** | Text/number/date/select/multi_select; JSONB storage per entity type |
| **Email System** | Templates with merge tags; tracking (open/click metrics) |
| **Competitor Tracking** | Per-deal strengths/weaknesses/price comparison |
| **File Attachments** | Per entity (deal/account/contact/lead/ticket/contract); file upload storage |
| **Sales Forecast** | Period-based targets vs actual with attainment % |
| **CSV Import/Export** | Duplicate detection, error logging, bulk operations |
| **Cross-Module** | Deal → PMS project creation integration |
| **Campaign ROI** | Revenue, ROI%, cost per lead metrics |
| **Contact 360** | Consolidated view (deals/activities/emails/tickets tabs) |
| **Deal Details** | Consolidated tabs with all related data |
| **Pipeline Filters** | Owner, value range, close date filtering |
| **BANT Checklist** | Lead qualification checklist on detail view |
| **Account Revenue** | Monthly breakdown chart from won deals |
| **Bulk Operations** | Lead disqualify, deal reopen, etc. |

---

## CRM Module API (Phase 1-7 Expanded)

### Core Entity Endpoints (Contacts, Deals, Accounts, Leads)

**Contacts:**
- `POST /crm/workspaces/{workspace_id}/contacts` — Create
- `GET /crm/workspaces/{workspace_id}/contacts` — List with search/pagination
- `GET /crm/workspaces/{workspace_id}/contacts/{contact_id}` — Detail
- `PATCH /crm/workspaces/{workspace_id}/contacts/{contact_id}` — Update
- `DELETE /crm/workspaces/{workspace_id}/contacts/{contact_id}` — Delete

**Deals:**
- `POST /crm/workspaces/{workspace_id}/deals` — Create
- `GET /crm/workspaces/{workspace_id}/deals` — List with stage/owner/value filters
- `GET /crm/workspaces/{workspace_id}/deals/{deal_id}` — Detail (includes contact roles, attachments, quotes)
- `PATCH /crm/workspaces/{workspace_id}/deals/{deal_id}` — Update
- `DELETE /crm/workspaces/{workspace_id}/deals/{deal_id}` — Delete
- `POST /crm/workspaces/{workspace_id}/deals/{deal_id}/reopen` — Reopen closed deal

**Accounts:**
- `CRUD` for account portfolio management; total_revenue auto-aggregated

**Leads:**
- `CRUD` with scoring, duplicate detection; status flow validation

### Quotation System

- `POST /crm/workspaces/{workspace_id}/quotations` — Create with line items
- `GET /crm/workspaces/{workspace_id}/quotations` — List by deal
- `PATCH /crm/workspaces/{workspace_id}/quotations/{quotation_id}` — Update
- `POST /crm/workspaces/{workspace_id}/quotations/{quotation_id}/accept` — Accept (syncs deal.value; >20% discount warning)

### Custom Fields & Email

- `CRUD /crm/workspaces/{workspace_id}/custom-fields` — Define fields per entity type
- `GET /crm/workspaces/{workspace_id}/custom-fields` — List by entity_type
- `POST /crm/workspaces/{workspace_id}/email-templates` — Create/send templates
- `GET /crm/workspaces/{workspace_id}/email-logs` — Track opens/clicks

### File Attachments & Notifications

- `POST /crm/workspaces/{workspace_id}/attachments` — Upload (multipart/form-data)
- `GET /crm/workspaces/{workspace_id}/attachments` — List by entity
- `GET /crm/workspaces/{workspace_id}/notifications` — List in-app notifications

### Competitor & Contract Management

- `CRUD /crm/workspaces/{workspace_id}/deal-competitors` — Track competitors per deal
- `CRUD /crm/workspaces/{workspace_id}/contracts` — Manage contracts (draft→active→expired)
- `POST /crm/workspaces/{workspace_id}/contracts/{contract_id}/renew` — Create renewal

### Multi-Contact & Deal Contact Roles

- `POST /crm/workspaces/{workspace_id}/deal-contacts` — Assign contact with role
- `GET /crm/workspaces/{workspace_id}/deals/{deal_id}/contacts` — List roles per deal
- Roles: decision_maker, influencer, champion, user, evaluator

### Forecasting & Import/Export

- `GET /crm/workspaces/{workspace_id}/forecasts` — Period-based targets vs actual
- `POST /crm/workspaces/{workspace_id}/import` — CSV import with duplicate detection
- `GET /crm/workspaces/{workspace_id}/export` — CSV export (leads/contacts/pipeline)

### Analytics & Workflows

**Workflows:**
- `POST /crm/workflows/leads/distribute` — Round-robin distribution
- `GET /crm/workflows/leads/stale` — Stale lead list
- `POST /crm/workflows/deals/{deal_id}/close` — Close with outcome/reason
- `GET /crm/workflows/deals/stale` — Stale deal list
- `GET /crm/workflows/data-quality/report` — Health score (0-100)
- `GET /crm/workflows/governance/alerts` — Compliance alerts

**Analytics:**
- `GET /crm/analytics/funnel` — Sales funnel by stage
- `GET /crm/analytics/velocity` — Deal velocity (days per stage)
- `GET /crm/analytics/revenue-trend` — Monthly revenue trend
- `GET /crm/analytics/campaign-roi` — Campaign metrics (revenue, ROI%, CPL)

### Frontend Integration

- **Shared components**: `crm-data-table`, `crm-page-header`, `crm-pagination`, `deal-close-dialog`, `lead-distribute-dialog`, `stale-deals-alert`, `sales-funnel-chart`
- **Routes**: `/crm` redirects to `/crm/contacts`; sidebar shows CRM nav when `activeModule === 'crm'`
- **State**: TanStack Query v5 hooks (`useContacts`, `useDeals`, `useGovernanceAlerts`, `useDistributeLeads`, `useCloseDeal`) + Zustand workspace store
- **Dashboard**: CRM dashboard displays governance alerts banner, sales funnel chart by stage, deal velocity KPI, health score badge
- **Search**: client-side pagination + server-side ILIKE filtering

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
