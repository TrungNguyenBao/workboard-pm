# A-ERP — Project Changelog

All significant changes, features, and fixes are recorded here.
Format: `## [version] — YYYY-MM-DD` with grouped entries.

---

## [2.0.0] — 2026-03-02

### Added — A-ERP Restructure

- **Modular Backend Architecture** — Reorganized into `modules/pms/`, `modules/wms/`, `modules/hrm/`, `modules/crm/` with isolated routers, services, models, schemas per module. PMS routes now prefixed with `/pms/`. Shared code (auth, workspaces, teams) remains in top-level dirs.
- **WMS Module — Full CRUD (5 entities)** — Complete implementation for Warehouse, Product, Device, Supplier, and InventoryItem. Models, CRUD services, paginated API routers, Pydantic schemas with `PaginatedResponse` generic. Tables: `warehouses`, `wms_products`, `wms_devices`, `wms_suppliers`, `inventory_items`. All routes prefixed with `/wms/`. Workspace-scoped with RBAC.
- **WMS Frontend — Full UI** — 5 list pages (warehouses, products, devices, suppliers, inventory), 5 form dialogs (create/edit), 5 TanStack Query hooks, 3 shared WMS components (wms-data-table, wms-page-header, wms-pagination). Lazy-loaded routes under `modules/wms/features/`.
- **HRM Module Scaffold** — Department and Employee models, CRUD services/routers/schemas. Tables: `departments`, `employees`.
- **CRM Module Scaffold** — Contact and Deal models, CRUD services/routers/schemas. Tables: `contacts`, `deals`.
- **Agent Layer** — Abstract `BaseAgent` with capabilities, `AgentRegistry` for registration/lookup, domain agent stubs (PMS, WMS, HRM, CRM), `AgentOrchestrator` for cross-module routing. REST endpoint: `POST /agents/{module}/invoke`.
- **MCP Protocol Layer** — `MCPEnvelope` protocol model, in-process `EventBus` (pub/sub), `SharedContext` key-value store, `PolicyEngine` with governance rules and audit logging.
- **Frontend Module Structure** — PMS features moved to `modules/pms/features/`. Shell components (app-shell, sidebar, header, module-switcher) moved to `shared/components/shell/`. Module switcher allows navigation between PMS, WMS, HRM, CRM.
- **Frontend Module Routes** — All PMS routes prefixed: `/pms/my-tasks`, `/pms/projects/:id/board`, etc. WMS fully implemented. HRM/CRM placeholder pages at `/hrm`, `/crm`.
- **Alembic Migrations** — Migration 0007 (initial WMS/HRM/CRM scaffold); Migration 0008 (wms_add_products_devices_suppliers) adds 3 new WMS tables with workspace scoping and foreign keys.

---

## [Unreleased]

### Added
- **Board View Drag-and-Drop Improvements** (`refactor: kanban DnD with between-task insertion`)
  - Extracted draggable task card to `board-task-card.tsx` component.
  - Extracted kanban column to `board-kanban-column.tsx` with `useDroppable` for empty column drops.
  - Extracted section creation input to `board-add-section-input.tsx`.
  - Board page refactored from 375→155 lines with improved separation of concerns.
  - Implemented `closestCorners` collision detection (better for kanban layout).
  - Added `calcDropPosition()` for fractional indexing between tasks (not just append).
  - Proper `handleDragEnd` with between-task insertion logic.
  - Split task data: `allTasksForSection` (position calc) vs `visibleTasksForSection` (rendering).
  - Optimistic cache updates in `useMoveTask` hook (onMutate/onError/onSettled).
  - Fixed DragOverlay opacity bug and improved ghost card visibility.
  - Empty columns now properly receive dropped tasks via `useDroppable`.
  - Tasks can be dropped between existing tasks, not just appended to end.

- **Recurring Tasks** (`feat: recurring tasks with ARQ cron job`)
  - New columns on `tasks`: `recurrence_rule`, `recurrence_cron_expr`, `recurrence_end_date`, `parent_recurring_id`, `last_generated_date`.
  - Support for 5 recurrence patterns: `daily`, `weekly`, `biweekly`, `monthly`, `custom_cron`.
  - ARQ nightly cron job `spawn_recurring_tasks` runs at 2 AM UTC daily to generate occurrences.
  - Parent template tasks cannot be marked complete (template tasks never complete independently).
  - Spawned occurrence tasks are independent and complete normally.
  - `croniter` library used for custom CRON expression validation and date calculation.
  - Frontend: Recurrence picker component in task detail drawer with rule/cron/end-date fields.
  - Recurring badge displayed on task cards in board and list views.
  - Occurrences list shows under parent template task in detail drawer.

- **Custom Fields** (`feat: custom fields with 7 field types`)
  - New JSONB `custom_fields` column on `tasks` for storing field values.
  - New `custom_field_definitions` table (per-project) for storing field schemas.
  - Support for 7 field types: `text`, `number`, `date`, `single_select`, `multi_select`, `checkbox`, `url`.
  - Soft-delete on field definitions (task data preserved when definition deleted).
  - Validation at service layer: type checking, required fields, select option validation.
  - Select options stored as JSONB array: `[{"id": "opt_1", "label": "High", "color": "#FF6B6B"}]`.
  - Frontend: Custom field config panel in project settings (CRUD + reorder).
  - Custom field rendering in task detail drawer (type-specific inputs).
  - Empty state shown when no fields configured.

- **Goals / Portfolio Tracking** (`feat: goals with project/task linking and auto-progress`)
  - New `goals` table at workspace level (not project-level).
  - New join tables: `goal_project_links`, `goal_task_links` for linking.
  - Status enum: `on_track`, `at_risk`, `off_track`, `achieved`, `dropped`.
  - Progress calculation: `manual` (user-set) or `auto` (% of completed linked tasks).
  - Goal colors customizable; owner is workspace member.
  - Soft-delete on goals (links cascade-deleted with goal).
  - Frontend: Goals list page with card grid layout (responsive 1-3 cols).
  - Goal cards show title, status badge, progress bar, owner avatar, due date, link counts.
  - Goal detail drawer: edit all fields inline, link/unlink projects and tasks.
  - Link dialogs: checkbox list for projects; project selector + task list for tasks.
  - Sidebar navigation: "Goals" item linking to goals page.
  - Auto progress updates when linked tasks are completed.

### Fixed
- **Security**: Workspace-goal ownership verification; project-field ownership verification; task ownership checks.
- **Frontend**: Recurrence value mismatch (custom → custom_cron normalization).
- **Frontend**: Select field value rendering uses option ID instead of label.

### Other
- **Activity Log / Timeline** (`feat: add activity log with timeline UI for tasks and projects`)
  - New `activity_logs` table: `workspace_id`, `project_id`, `entity_type`, `entity_id`, `actor_id`, `action`, `changes` (JSONB). Indexes on `(entity_type, entity_id)` and `created_at`.
  - `ActivityLog` SQLAlchemy model (`backend/app/models/activity_log.py`).
  - Alembic migration `0002_add_activity_log` creating the table and indexes.
  - `ActivityLogResponse` Pydantic schema with actor enrichment (`actor_name`, `actor_avatar_url`).
  - `create_activity()` service function — persists entry, then publishes `activity_created` SSE event to the workspace channel.
  - `list_activity()` service function — cursor-based pagination ordered by `created_at` DESC.
  - New API router with two endpoints (minimum `viewer` role required):
    - `GET /projects/{project_id}/activity?limit=50&cursor=` — project-level feed
    - `GET /projects/{project_id}/tasks/{task_id}/activity?limit=20` — task-level history
  - `activity-timeline.tsx` — project overview "Recent activity" section.
  - `task-activity.tsx` — task drawer "History" tab component.
  - Activity events emitted from task service (create / update field-change tracking / delete), comment service (create), and project service (create).
  - `use-sse.ts` updated to handle `activity_created` events and invalidate relevant TanStack Query caches.

---

## [0.5.0] — 2026-02-26

### Added
- Docker services for backend (FastAPI) and frontend (Vite) added to `docker-compose.yml`.

---

## [0.4.0] — 2026-02-25

### Added
- Workspace member management UI.
- Comment and assignment push notifications via SSE.

---

## [0.3.0] — 2026-02-24

### Fixed
- Overview stats consistency issues.
- Null priority key handling.
- Error state display in project overview.

### Added
- Project overview page with stats dashboard.

---

## [0.1.0] — Initial

### Added
- Core authentication: JWT access token (in-memory) + HttpOnly refresh-token cookie.
- Workspace and project CRUD with RBAC (workspace roles: admin / member / guest; project roles: owner / editor / commenter / viewer).
- Task management: list, board (kanban), and calendar views with drag-and-drop fractional indexing.
- Real-time via SSE + in-process publish/subscribe broker per workspace.
- Full-text search via PostgreSQL `tsvector` trigger on task title + description.
- Notifications system with per-type enum and unread count badge.
- Sections, tags, attachments, task dependencies, subtasks, task followers.
- Background jobs via ARQ (Redis-backed).
