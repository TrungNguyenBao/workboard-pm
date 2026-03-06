# A-ERP — Development Roadmap

**Last updated:** 2026-03-03

---

## Phase 1 — Foundation (Complete)

Core infrastructure, authentication, and data model.

| Item | Status |
|---|---|
| FastAPI project scaffold (uv, Python 3.12) | Done |
| PostgreSQL 15 + Redis 7 via Docker Compose | Done |
| SQLAlchemy 2.0 async models + Alembic migrations | Done |
| JWT auth (access token in-memory + HttpOnly refresh cookie) | Done |
| Workspace & project CRUD | Done |
| RBAC: workspace roles (admin/member/guest) + project roles (owner/editor/commenter/viewer) | Done |
| React 18 + Vite + TanStack Query v5 + Zustand | Done |
| Protected routing + auth pages | Done |

---

## Phase 2 — Task Management Core (Complete)

| Item | Status |
|---|---|
| Task CRUD with soft delete | Done |
| Sections with drag-and-drop fractional indexing | Done |
| List view | Done |
| Board (kanban) view | Done |
| Board DnD: between-task insertion with fractional indexing | Done |
| Calendar view | Done |
| Task detail drawer (title, description, assignee, due date, priority) | Done |
| Subtasks + task dependencies | Done |
| Tags + attachments | Done |
| Task followers | Done |
| Full-text search via PostgreSQL tsvector trigger | Done |
| Command palette (cmdk) | Done |

---

## Phase 3 — Real-time & Collaboration (Complete)

| Item | Status |
|---|---|
| SSE broker (in-process publish/subscribe per workspace) | Done |
| Task and section update events pushed via SSE | Done |
| Notifications system with unread badge | Done |
| Comment create/mention notifications | Done |
| Assignment notifications | Done |
| Workspace member management UI | Done |

---

## Phase 4 — Activity Log & Audit Trail (Complete)

| Item | Status |
|---|---|
| `activity_logs` table with JSONB change tracking | Done |
| `create_activity()` service + SSE publish on write | Done |
| Cursor-based pagination for activity feeds | Done |
| Project-level activity timeline (`activity-timeline.tsx`) | Done |
| Task-level history panel in drawer (`task-activity.tsx`) | Done |
| Activity events from task / comment / project services | Done |
| `GET /projects/{id}/activity` endpoint | Done |
| `GET /projects/{id}/tasks/{id}/activity` endpoint | Done |

---

## Phase 5 — Polish & Production Readiness (Planned)

| Item | Status |
|---|---|
| Docker multi-stage production builds | Done |
| Nginx reverse proxy config | Done |
| Environment-based config validation on startup | Done |
| Rate limiting per-route via slowapi | Done |
| Structured JSON logging (structlog) | Done |
| E2E tests (Playwright) | Planned |
| MinIO / S3 file storage for attachments | Planned |
| Email delivery for notifications (ARQ background job) | Planned |

---

## Phase 6 — Advanced Features (Complete)

| Item | Status |
|---|---|
| Timeline / Gantt view | Done |
| Recurring tasks | Done |
| Custom fields | Done |
| Portfolio / goals tracking | Done |
| PostgreSQL FTS → Meilisearch upgrade | Backlog |
| SSE broker → Redis Pub/Sub for multi-instance | Backlog |
| Webhooks for external integrations | Backlog |
| Public API with API key auth | Backlog |

---

## Phase 7 — A-ERP Restructure (Complete)

Transformed WorkBoard into A-ERP (Agentic Enterprise Resource Platform) with modular architecture.

| Item | Status |
|---|---|
| Backend: PMS module extraction (`modules/pms/`) | Done |
| Backend: WMS full CRUD (Product, Device, Supplier, Warehouse, InventoryItem models + services + routers + schemas) | Done |
| Backend: WMS paginated API endpoints with `PaginatedResponse` generic | Done |
| Backend: WMS Alembic migration (wms_products, wms_devices, wms_suppliers tables) | Done |
| Backend: Scaffold HRM module (Department, Employee) | Done |
| Backend: Scaffold CRM module (Contact, Deal) | Done |
| Backend: Agent layer (BaseAgent, registry, orchestrator, domain stubs) | Done |
| Backend: MCP protocol layer (envelope, bus, context, policy) | Done |
| Frontend: PMS module extraction (`modules/pms/features/`) | Done |
| Frontend: WMS full UI (5 list pages, 5 form dialogs, 5 TanStack Query hooks, 3 shared components) | Done |
| Frontend: WMS data-table, page-header, pagination shared components | Done |
| Frontend: Shell components (app-shell, sidebar, module-switcher) | Done |
| Frontend: Module-prefixed routes (`/pms/*`, `/wms/*`, `/hrm`, `/crm`) | Done |
| Frontend: API URL migration (`/projects/` → `/pms/projects/`) | Done |
| Frontend: HRM placeholder pages | Done |
| Frontend: CRM full UI (contacts + deals list, form dialogs, hooks, pagination, filtering) | Done |
| Config: pyproject.toml renamed to a-erp-backend | Done |
| Docs: CLAUDE.md, system-architecture, roadmap, changelog updated | Done |

---

## Phase 8 — HRM Module Implementation (Complete)

Full HRM module with pagination/filtering, leave management, and payroll tracking.

| Item | Status |
|---|---|
| Backend: Pagination schema moved to shared (`schemas/pagination.py`) | Done |
| Backend: Department list with pagination/filtering | Done |
| Backend: Employee list with pagination/filtering | Done |
| Backend: LeaveType and LeaveRequest models with approval workflow | Done |
| Backend: PayrollRecord model (salary, deductions, bonus) | Done |
| Backend: HRM routers for departments, employees, leave, payroll | Done |
| Backend: Alembic migration 0007 for all HRM tables | Done |
| Frontend: HRM shared components (data-table, page-header, pagination) | Done |
| Frontend: Departments CRUD UI (list, create, edit, delete) | Done |
| Frontend: Employees CRUD UI (list, create, edit, delete, department filtering) | Done |
| Frontend: Leave Requests UI (list, create, approve, reject) | Done |
| Frontend: Payroll Records UI (list, create, edit, delete) | Done |
| Frontend: HRM router with 4 sub-routes (`/hrm/departments`, `/hrm/employees`, `/hrm/leave`, `/hrm/payroll`) | Done |
| Frontend: Sidebar navigation for HRM features | Done |

---

## Phase 9 — Frontend i18n Multi-language Support (Complete)

English and Vietnamese (EN/VI) internationalization across entire A-ERP frontend using react-i18next.

| Item | Status |
|---|---|
| Frontend: Install react-i18next and i18next packages | Done |
| Frontend: Create i18n config with 5 namespaces (common, pms, wms, hrm, crm) | Done |
| Frontend: Create 10 translation JSON files (vi/en for each namespace) | Done |
| Frontend: Replace all hardcoded strings with t() calls in 55+ components | Done |
| Frontend: Create language switcher component with Globe icon | Done |
| Frontend: Add language switcher to sidebar footer | Done |
| Frontend: Add language option to settings page | Done |
| Frontend: Persist language preference in localStorage (key: a-erp-language) | Done |

---

## Phase 10 — Seed Demo Data (Complete)

Restructured and extended seed script to populate all modules with realistic Vietnamese-friendly demo data.

| Item | Status |
|---|---|
| Backend: Restructure monolithic `seed.py` into modular files under `app/scripts/` | Done |
| Backend: Split `seed_pms.py` into 4 files (seed_pms.py, seed_pms_setup.py, seed_pms_tasks.py, seed_pms_extras.py) to respect 200-line limit | Done |
| Backend: Create `seed_wms.py` with 2 warehouses, 6 products, 3 suppliers, 8 devices, 6 inventory items | Done |
| Backend: Create `seed_hrm.py` with 4 departments, 8 employees, 4 leave types, 6 leave requests, 16 payroll records | Done |
| Backend: Update `TRUNCATE_TABLES` in `seed_shared.py` to include all WMS and HRM tables | Done |
| Backend: Create `__main__.py` entry point orchestrating all seed modules | Done |
| Backend: Remove old `backend/scripts/seed.py` and create `app/scripts/` module path | Done |
| Verification: Run `make seed` end-to-end without errors | Done |
| Verification: All modules populated with correct data | Done |
| Verification: Seed script is idempotent (running twice produces same result) | Done |

---

## Phase 11 — Full UI Overhaul (Complete)

Comprehensive frontend redesign with design system foundation, DRY component refactor, shell redesign, dark mode support, and module dashboards.

| Item | Status |
|---|---|
| Frontend: Create shared `DataTable` component with TanStack Table (sorting, selection, skeleton, empty state) | Done |
| Frontend: Create shared `PageHeader`, `PaginationControls`, `Breadcrumb`, `EmptyState`, `SkeletonTable`, `KpiCard` components | Done |
| Frontend: Add dark mode toggle (System/Light/Dark) to shell header | Done |
| Frontend: Add dark mode support across all pages and components | Done |
| Frontend: Split 421-line sidebar into 6 focused files (workspace-picker, module-switcher, navigation, project-nav-item, user-footer) | Done |
| Frontend: Move module switcher into sidebar (replace header strip) | Done |
| Frontend: Add breadcrumbs to shell header for all routes | Done |
| Frontend: Add sidebar collapse-to-icons mode with Zustand persistence | Done |
| Frontend: Polish auth pages with entrance animations and dark mode support | Done |
| Frontend: Update PMS module pages (my-tasks, project header, goals) with shared components and empty states | Done |
| Frontend: Migrate all 11 WMS/HRM/CRM list pages to shared DataTable + PageHeader + PaginationControls | Done |
| Frontend: Delete 9 duplicate module-specific components (wms/hrm/crm-data-table, page-header, pagination) | Done |
| Frontend: Create module dashboard pages for PMS, WMS, HRM, CRM with KPI cards and Recharts charts | Done |
| Frontend: Add new dashboard routes (`/pms/dashboard`, `/wms/dashboard`, `/hrm/dashboard`, `/crm/dashboard`) | Done |
| Frontend: Add `prefers-reduced-motion` support to index.css | Done |
| Dependencies: Install `@tanstack/react-table` for headless data table | Done |
| Dependencies: Install `recharts` for dashboard charts | Done |
