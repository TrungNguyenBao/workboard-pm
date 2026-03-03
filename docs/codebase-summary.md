# A-ERP Codebase Summary

**Last generated:** 2026-03-03
**Based on commit:** Latest HRM implementation

---

## Overview

**A-ERP** (Agentic Enterprise Resource Platform) is a modular, multi-tenant ERP system built with FastAPI (backend) and React 18 + Vite (frontend). The platform is architected for extensibility across four enterprise modules:

- **PMS** — Project Management System (Fully implemented)
- **WMS** — Warehouse Management System (Fully implemented)
- **HRM** — Human Resource Management (Fully implemented)
- **CRM** — Customer Relationship Management (Fully implemented)

**Technology Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy 2.0 ORM, PostgreSQL 15, Redis 7, Alembic migrations
- Frontend: React 18, TypeScript, TanStack Query v5, Zustand, Tailwind CSS, shadcn/ui
- Deployment: Docker Compose (dev), multi-stage production builds, Nginx proxy, structured logging

---

## Backend Architecture (309 files, 211k tokens)

### Directory Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── router.py                    # Aggregates all module routers
│   │   └── routers/                     # Shared endpoints (auth, workspaces, teams, notifications, SSE, agents)
│   ├── models/                          # Shared ORM models (User, Workspace, Team, Token)
│   ├── schemas/                         # Shared Pydantic models (auth, workspace, team, pagination)
│   ├── services/                        # Shared business logic (auth, workspace, notifications, SSE)
│   ├── dependencies/                    # Reusable Depends() functions (auth, RBAC)
│   ├── core/
│   │   ├── config.py                    # Environment + settings validation
│   │   ├── database.py                  # Async SQLAlchemy engine + session factory
│   │   ├── security.py                  # JWT + password hashing utilities
│   │   └── logging_config.py            # Structured JSON logging (structlog)
│   ├── modules/                         # Feature modules (PMS, WMS, HRM, CRM)
│   │   ├── pms/                         # Project Management System (complete)
│   │   ├── wms/                         # Warehouse Management System (complete)
│   │   ├── hrm/                         # Human Resource Management (complete)
│   │   └── crm/                         # Customer Relationship Management (complete)
│   ├── agents/                          # Agent orchestration layer
│   │   ├── base.py                      # Abstract BaseAgent
│   │   ├── registry.py                  # Agent registration + lookup
│   │   ├── orchestrator.py              # Cross-module routing
│   │   └── {pms,wms,hrm,crm}_agent.py  # Domain agent stubs
│   ├── mcp/                             # Model Context Protocol layer
│   │   ├── protocol.py                  # MCPEnvelope Pydantic model
│   │   ├── bus.py                       # In-process pub/sub event bus
│   │   ├── context.py                   # Shared context key-value store
│   │   └── policy.py                    # Governance rules + audit log
│   ├── worker/                          # ARQ background job definitions
│   └── main.py                          # FastAPI app initialization
├── alembic/
│   ├── env.py                           # Migration runner
│   └── versions/
│       ├── 0001_initial_schema.py       # Core tables (users, workspaces, teams, projects, tasks, etc.)
│       ├── 0002_add_activity_log.py     # Activity audit trail
│       ├── 0003_add_task_start_date.py  # Task timeline fields
│       ├── 0004_add_recurring_task_fields.py  # Recurring task support
│       ├── 0005_add_custom_fields.py    # Dynamic field definitions per project
│       ├── 0006_add_goals.py            # Goals + portfolio tracking
│       ├── 0007_add_hrm_leave_payroll_tables.py  # HRM leave types, requests, payroll records
│       └── 203a42c349d6_wms_add_products_devices_suppliers_.py  # WMS extension (products, devices, suppliers)
├── pyproject.toml                       # Project metadata (uv, package name: a-erp-backend)
├── alembic.ini                          # Alembic configuration
└── Dockerfile                           # Multi-stage production image
```

### Module Architecture

Each module (PMS, WMS, HRM, CRM) follows this consistent structure:

```
modules/{module}/
├── router.py                     # Module router aggregator (mounts sub-routers)
├── routers/                      # HTTP endpoint files (one per entity)
├── services/                     # Business logic layer
├── models/                       # SQLAlchemy ORM models
├── schemas/                      # Pydantic request/response models
└── dependencies/                 # Module-specific RBAC checks (where applicable)
```

**Example: WMS Module**

```
modules/wms/
├── router.py
├── routers/
│   ├── warehouses.py    → GET/POST /wms/warehouses, /{id}, PATCH/{id}, DELETE/{id}
│   ├── products.py      → GET/POST /wms/products, /{id}, PATCH/{id}, DELETE/{id}
│   ├── devices.py       → GET/POST /wms/devices, /{id}, PATCH/{id}, DELETE/{id}
│   ├── suppliers.py     → GET/POST /wms/suppliers, /{id}, PATCH/{id}, DELETE/{id}
│   └── inventory_items.py → GET/POST /wms/inventory, /{id}, PATCH/{id}, DELETE/{id}
├── services/
│   ├── warehouse.py     # CRUD, workspace-scoped queries
│   ├── product.py
│   ├── device.py
│   ├── supplier.py
│   └── inventory_item.py
├── models/
│   ├── warehouse.py     # Warehouse ORM model
│   ├── product.py       # WmsProduct ORM model
│   ├── device.py        # WmsDevice ORM model
│   ├── supplier.py      # WmsSupplier ORM model
│   └── inventory_item.py # InventoryItem ORM model
├── schemas/
│   ├── warehouse.py     # WarehouseCreate, WarehouseResponse, etc.
│   ├── product.py       # ProductCreate, ProductResponse, etc.
│   ├── device.py
│   ├── supplier.py
│   ├── inventory_item.py
│   └── pagination.py    # PaginatedResponse[T] generic schema
└── dependencies/        # (empty for WMS; used by PMS for project-level RBAC)
```

### Key Backend Patterns

**Router Pattern:** Thin, declarative layer that validates auth/RBAC and delegates to services.

```python
@router.get("/wms/products", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_role("member")),
):
    return await list_products_service(db, workspace_id=current_user.workspace_id, limit=limit, offset=offset)
```

**Service Pattern:** All business logic + DB mutations. Uses keyword-only args to prevent order errors.

```python
async def create_product(
    db: AsyncSession,
    *,
    workspace_id: UUID,
    name: str,
    sku: str,
    unit_price: float,
) -> WmsProduct:
    product = WmsProduct(workspace_id=workspace_id, name=name, sku=sku, unit_price=unit_price)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product
```

**Pagination Pattern:** Generic `PaginatedResponse[T]` for consistent list APIs (WMS uses offset-based; PMS uses cursor-based for activity logs).

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

**ORM Pattern:** SQLAlchemy 2.0 with typed annotations, mixins, and composite indexes.

```python
class WmsProduct(Base):
    __tablename__ = "wms_products"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    workspace_id: Mapped[UUID] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str]
    sku: Mapped[str]
    description: Mapped[str | None]
    unit_price: Mapped[Decimal]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace: Mapped["Workspace"] = relationship(back_populates="products")
```

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── i18n/                             # Internationalization (i18next)
│   │   ├── index.ts                      # i18next config + initialization
│   │   └── locales/
│   │       ├── vi/                       # Vietnamese translations
│   │       │   ├── common.json           # Shared strings (auth, nav, settings, UI patterns)
│   │       │   ├── pms.json              # PMS module strings
│   │       │   ├── wms.json              # WMS module strings
│   │       │   ├── hrm.json              # HRM module strings
│   │       │   └── crm.json              # CRM module strings
│   │       └── en/                       # English translations (same structure)
│   ├── shared/
│   │   ├── components/
│   │   │   ├── shell/
│   │   │   │   ├── app-shell.tsx         # Main layout wrapper
│   │   │   │   ├── sidebar.tsx           # Module navigation (PMS/WMS/HRM/CRM switcher)
│   │   │   │   ├── header.tsx            # Top bar with user/workspace menu
│   │   │   │   ├── keyboard-shortcuts.tsx # Command palette + hotkeys
│   │   │   │   └── language-switcher.tsx # Language selector (Globe icon + dropdown)
│   │   │   └── ui/                       # shadcn/ui wrapped components (button, dialog, form, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts                    # API client (baseURL, auth headers)
│   │   │   ├── query-client.ts           # TanStack Query client config
│   │   │   └── utils.ts                  # Utilities (formatDate, cn, etc.)
│   │   ├── hooks/
│   │   │   └── use-sse.ts                # Single SSE connection per session, event dispatch
│   │   └── stores/
│   │       ├── auth.store.ts             # Zustand auth state (token, user, login/logout)
│   │       ├── workspace.store.ts        # Active workspace + members
│   │       └── module.store.ts           # Active module tracking
│   ├── features/                         # Shared features (auth, notifications, search, settings)
│   ├── modules/
│   │   ├── pms/features/                 # Project Management module
│   │   │   ├── dashboard/                # Overview + recent tasks
│   │   │   ├── projects/                 # Project list + detail
│   │   │   ├── tasks/                    # Task CRUD + board/list/calendar views
│   │   │   ├── goals/                    # Goals list + portfolio tracking
│   │   │   └── custom-fields/            # Field definition editor
│   │   ├── wms/features/                 # Warehouse Management module
│   │   │   ├── warehouses/               # Warehouse list + form dialog
│   │   │   ├── products/                 # Product list + form dialog + TanStack hook
│   │   │   ├── devices/                  # Device list + form dialog + TanStack hook
│   │   │   ├── suppliers/                # Supplier list + form dialog + TanStack hook
│   │   │   ├── inventory/                # Inventory item list + form dialog + TanStack hook
│   │   │   └── shared/                   # WMS shared components (data-table, page-header, pagination)
│   │   ├── hrm/features/                 # Human Resource Management module
│   │   │   ├── departments/              # Department list + form dialog + TanStack hook
│   │   │   ├── employees/                # Employee list + form dialog + department select + TanStack hook
│   │   │   ├── leave/                    # Leave types + requests + approve/reject workflow + TanStack hooks
│   │   │   ├── payroll/                  # Payroll records list + form dialog + currency formatting + TanStack hook
│   │   │   └── shared/                   # HRM shared components (data-table, page-header, pagination)
│   │   └── crm/features/                 # Customer Relationship Management module
│   │       ├── contacts/                 # Contact list + form dialog + TanStack hook
│   │       ├── deals/                    # Deal list + form dialog + contact select + TanStack hook
│   │       └── shared/                   # CRM shared components (data-table, page-header, pagination)
│   ├── app/
│   │   ├── App.tsx                       # Root component + providers
│   │   └── router.tsx                    # TanStack Router routes (pms/*, wms/*, etc.)
│   └── main.tsx
├── vite.config.ts
├── tsconfig.json                         # strict: true
└── Dockerfile                            # Multi-stage: build → nginx
```

### Feature Folder Pattern

```
features/{name}/
├── pages/                                # Route-level page components
│   └── {name}-list.tsx
├── components/                           # UI components (presentational + container)
│   └── {name}-form-dialog.tsx
├── hooks/                                # TanStack Query hooks
│   └── use-{name}s.ts                   # useQuery, useMutation, queryKey
└── tests/                                # vitest + React Testing Library
```

**WMS Example: Products Module**

```
modules/wms/features/products/
├── pages/
│   └── products-list.tsx                # Page component (table + create button)
├── components/
│   └── product-form-dialog.tsx          # Form dialog (create/edit, Zod validation)
├── hooks/
│   └── use-products.ts                  # useProductsList (query), useCreateProduct (mutation)
└── tests/
    └── use-products.test.ts
```

### State Management

| Concern | Tool | Location |
|---------|------|----------|
| Server state (tasks, projects, products) | TanStack Query v5 | Hooks in `features/*/hooks/` |
| Global auth + workspace | Zustand | `stores/auth.store.ts`, `stores/workspace.store.ts` |
| Form validation | React Hook Form + Zod | Inline per form component |
| Local UI state | useState | Within component |

### Internationalization (i18n)

**Framework:** react-i18next with i18next

**Language Support:**
- Default language: Vietnamese (VI)
- Fallback language: Vietnamese
- Supported languages: Vietnamese (vi), English (en)

**Structure:**
- Configuration in `src/i18n/index.ts` initialized at module level before React renders
- Translations organized by namespace: `common` (shared), `pms`, `wms`, `hrm`, `crm`
- 10 JSON files in `src/i18n/locales/{vi,en}/` with identical key sets across languages
- 500+ user-facing strings catalogued: auth, navigation, buttons, labels, confirmations, empty states, toasts

**Usage Pattern:**
- Components use `const { t } = useTranslation()` or `useTranslation('pms')` for module namespace
- Multi-namespace access: `useTranslation(['pms', 'common'])` — first namespace is default, prefix others with `common:` (e.g., `t('common:common.cancel')`)
- Interpolation support: `t('key', { name: 'John' })` renders `{{name}}` placeholders

**Language Switching:**
- UI: Language switcher dropdown in sidebar footer + settings page
- Logic: `i18n.changeLanguage(lng)` triggers immediate re-render
- Persistence: User choice stored in `localStorage` key `a-erp-language`
- No page reload required; all `useTranslation()` consumers update reactively

**Bundle Impact:**
- 10 JSON files (~2KB each) bundled at build time
- No HTTP fetching or runtime parsing — all translations available upfront

### Real-time Integration

**SSE (Server-Sent Events):**
- `use-sse.ts` maintains single `EventSource` per authenticated session
- Subscribes to `/sse?workspace_id={id}`
- Dispatches events: `activity_created`, `notification`
- Calls `queryClient.invalidateQueries` to sync server state

---

## Data Model

### Core Tables (Shared)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | id, email, name, avatar_url, hashed_password | Authentication |
| `workspaces` | id, name, slug | Tenancy boundary |
| `workspace_members` | workspace_id, user_id, role | Workspace RBAC (admin/member/guest) |
| `teams` | id, workspace_id, name | Optional org structure |
| `projects` | id, workspace_id, name, visibility | Project container |
| `project_members` | project_id, user_id, role | Project RBAC (owner/editor/commenter/viewer) |
| `refresh_tokens` | id, user_id, token_hash, expires_at | HttpOnly auth cookie |

### PMS Tables (Project Management)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `sections` | id, project_id, name, position | Kanban columns / list sections |
| `tasks` | id, project_id, section_id, assignee_id, title, status, priority, position, due_date, search_vector | Task entity (soft delete) |
| `task_dependencies` | blocking_task_id, blocked_task_id | Task relationships |
| `task_followers` | task_id, user_id | Followers list |
| `tags` | id, workspace_id, name, color | Workspace-scoped tags |
| `task_tags` | task_id, tag_id | Task-tag junction |
| `comments` | id, task_id, author_id, body | Task comments (rich text) |
| `attachments` | id, task_id, filename, url, size | File uploads |
| `notifications` | id, user_id, actor_id, type, title, is_read | Typed enum notifications |
| `activity_logs` | id, workspace_id, project_id, entity_type, entity_id, actor_id, action, changes | Append-only audit trail |
| `custom_field_definitions` | id, project_id, name, field_type, is_required, options | Field schema per project |
| `goals` | id, workspace_id, title, status, progress, owner_id, due_date | Portfolio tracking |
| `goal_project_links`, `goal_task_links` | goal_id, project_id / goal_id, task_id | Goal relationships |

### WMS Tables (Warehouse Management)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `warehouses` | id, workspace_id, name, location, is_active | Warehouse registry |
| `wms_products` | id, workspace_id, sku, name, description, unit_price | Product catalog |
| `wms_devices` | id, workspace_id, device_id, device_type, location, status | Physical device tracking |
| `wms_suppliers` | id, workspace_id, name, email, phone, address | Supplier registry |
| `inventory_items` | id, workspace_id, warehouse_id, sku, name, quantity, unit | Stock tracking |

### HRM Tables (Human Resources)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `departments` | id, workspace_id, name, description | Department registry |
| `employees` | id, workspace_id, user_id, name, email, department_id, position, hire_date | Employee directory |
| `leave_types` | id, workspace_id, name, days_per_year | Leave type definitions (e.g., vacation, sick, unpaid) |
| `leave_requests` | id, employee_id (FK CASCADE), leave_type_id (FK RESTRICT), start_date, end_date, days, status, reviewed_by_id | Leave request workflow (pending/approved/rejected) |
| `payroll_records` | id, employee_id (FK CASCADE), period (YYYY-MM), gross, net, deductions (JSONB), status | Payroll history + tax deductions |

### CRM Tables (Customer Relations)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `contacts` | id, workspace_id, name, email, phone, company | Contact registry |
| `deals` | id, workspace_id, contact_id, title, value, stage | Sales pipeline |

---

## API Routes

### Shared Routes (All Modules)

- `POST /api/v1/auth/login` — Authenticate user
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/refresh` — Refresh access token
- `GET /api/v1/workspaces` — List user's workspaces
- `POST /api/v1/workspaces` — Create workspace
- `GET /api/v1/sse?workspace_id={id}` — SSE subscription
- `POST /api/v1/agents/{module}/invoke` — Agent invocation

### PMS Routes

- `GET/POST /api/v1/pms/projects` — Project CRUD
- `GET/POST /api/v1/pms/projects/{id}/sections` — Section CRUD
- `GET/POST /api/v1/pms/projects/{id}/tasks` — Task CRUD
- `GET/POST /api/v1/pms/projects/{id}/tasks/{id}/comments` — Comments
- `GET /api/v1/pms/projects/{id}/activity` — Activity timeline (cursor-paginated)
- `GET/POST /api/v1/pms/goals` — Portfolio goals
- `GET/POST /api/v1/pms/projects/{id}/custom-fields` — Field definitions

### WMS Routes

- `GET/POST /api/v1/wms/warehouses` — Warehouse CRUD (paginated)
- `GET/POST /api/v1/wms/products` — Product CRUD (paginated)
- `GET/POST /api/v1/wms/devices` — Device CRUD (paginated)
- `GET/POST /api/v1/wms/suppliers` — Supplier CRUD (paginated)
- `GET/POST /api/v1/wms/inventory` — Inventory CRUD (paginated)

All WMS endpoints use `?limit=20&offset=0` pagination with `PaginatedResponse` wrapper.

### HRM Routes

- `POST/GET/GET/:id/PATCH/DELETE /api/v1/hrm/workspaces/{id}/departments` — Department CRUD (member+/guest/guest/member/admin)
- `POST/GET/GET/:id/PATCH/DELETE /api/v1/hrm/workspaces/{id}/employees` — Employee CRUD (member+/guest/guest/member/admin)
- `POST/GET/PATCH/DELETE /api/v1/hrm/workspaces/{id}/leave-types` — Leave type CRUD (admin/guest/admin/admin)
- `POST/GET/PATCH/DELETE /api/v1/hrm/workspaces/{id}/leave-requests` — Leave request CRUD (member/guest/member/admin)
- `POST /api/v1/hrm/workspaces/{id}/leave-requests/{id}/approve` — Approve leave request (admin only)
- `POST /api/v1/hrm/workspaces/{id}/leave-requests/{id}/reject` — Reject leave request (admin only)
- `POST/GET/GET/:id/PATCH/DELETE /api/v1/hrm/workspaces/{id}/payroll-records` — Payroll CRUD (admin only)

All HRM endpoints use offset-based pagination (`?limit=20&offset=0`) with shared `PaginatedResponse` from `app/schemas/pagination.py`.

### CRM Routes

- `GET/POST /api/v1/crm/workspaces/{id}/contacts` — Contact CRUD (paginated)
- `GET/POST /api/v1/crm/workspaces/{id}/deals` — Deal CRUD (paginated)

---

## Key Features

### Authentication & Authorization

- **Access Token:** Short-lived JWT, stored in-memory (never localStorage)
- **Refresh Token:** Long-lived, HttpOnly cookie, hash stored in DB
- **RBAC:** Two independent role dimensions:
  - Workspace roles: `guest`, `member`, `admin`
  - Project roles: `viewer`, `commenter`, `editor`, `owner`
- **Dependencies:** `require_workspace_role()`, `require_project_role()` for endpoint guards

### Real-time Collaboration

- **SSE Broker:** In-process per-workspace subscribers (upgrade path: Redis Pub/Sub for multi-instance)
- **Event Types:** `activity_created`, `notification`, (extensible)
- **Frontend:** Single `EventSource` per session, event dispatch to TanStack Query invalidation

### Background Jobs (ARQ)

- **Redis:** Tasks enqueued and processed by ARQ worker
- **Current Uses:** Email delivery, recurring task generation (2 AM UTC daily)
- **Extensible:** Add new jobs in `worker/` and enqueue from service layer

### Search (PostgreSQL Full-Text)

- **Implementation:** `tasks.search_vector` (tsvector) on `title || description`
- **Index:** GIN `ix_tasks_search_vector` for `@@` operator
- **Upgrade Path:** Meilisearch for cross-entity search

### Pagination

- **PMS (Activity):** Cursor-based using UUID of last seen record
- **WMS (Lists):** Offset-based using limit + offset query params
- **Both:** Generic response envelope or plain JSON array

---

## Testing Strategy

### Backend (pytest)

- SQLite in-memory for unit/integration tests (TSVECTOR degradation for FTS)
- Fixtures for DB session, test user, test workspace
- Test structure mirrors source: `tests/test_services/test_*.py`, `tests/test_routers/test_*.py`

### Frontend (vitest)

- React Testing Library for component tests
- TanStack Query wrapper in test utils
- Files co-located in `features/{name}/tests/`
- No fake data mocks — use MSW or real test endpoints

### E2E (Playwright)

- Root `e2e/` directory
- Critical flows: login, create project, create task, drag-and-drop reorder

---

## Deployment

### Docker

- **Backend:** Multi-stage Dockerfile (build → slim final image)
- **Frontend:** Multi-stage Dockerfile (build → Nginx serving)
- **Compose:** `docker-compose.yml` for dev (PostgreSQL 15, Redis 7, backend, frontend services)

### Production Readiness

- **Config Validation:** Environment vars checked at startup
- **Rate Limiting:** slowapi per-route (e.g., auth endpoints)
- **Logging:** Structured JSON logs (structlog) with request IDs
- **Nginx Proxy:** Reverse proxy config (SSL termination, gzip, cache headers)

---

## Development Workflow

### Commands

```bash
# Start everything
make docker-up      # PostgreSQL + Redis
make dev            # Backend (port 8000) + Frontend (port 5173)

# Individually
make dev-backend    # FastAPI with hot reload
make dev-frontend   # Vite with HMR

# Database
make migrate        # Run Alembic migrations
make seed           # Seed test data

# Testing
make test           # pytest + vitest
make test-e2e       # Playwright E2E

# Code quality
make lint           # ruff + eslint
make format         # ruff format + prettier
```

### Git Conventions

- **Commits:** Conventional format (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **Branches:** Feature branches for new work
- **Pre-commit:** Run `make lint` before commit
- **Pre-push:** Run `make test` before push

---

## Standards & Guidelines

- **File size:** Max 200 lines per file; split at logical boundaries
- **Naming:** kebab-case for files, snake_case for Python, camelCase for JavaScript
- **Error handling:** Always use try/catch; never swallow errors silently
- **Code quality:** YAGNI / KISS / DRY principles
- **Documentation:** Keep files under 800 LOC; split large docs into modular structure

---

## Roadmap Status

- **Phase 1-4:** Complete (Foundation, Task Management, Real-time, Activity Log)
- **Phase 5:** Complete (Production readiness — Docker, Nginx, logging, rate limiting)
- **Phase 6:** Complete (Timeline, Recurring tasks, Custom fields, Goals)
- **Phase 7:** Complete (A-ERP restructure, WMS full CRUD, Agent layer, MCP protocol)
- **Phase 8:** Complete (HRM full implementation — departments, employees, leave, payroll)
- **Phase 9:** Complete (CRM full implementation — contacts, deals, pagination/search/filtering)

**Next Steps:**
- E2E test coverage (Playwright)
- MinIO / S3 for file attachments
- Email delivery (ARQ background job)
- Multi-instance support (Redis Pub/Sub upgrade)
- Advanced reporting and analytics dashboards

---

Generated by Repomix v1.12.0
Total: 346 files, 243k tokens, 992k chars
