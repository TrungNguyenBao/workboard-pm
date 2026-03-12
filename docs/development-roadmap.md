# A-ERP — Development Roadmap

**Last updated:** 2026-03-11

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

---

## Phase 12 — CRM SOP Workflow Operations (Complete)

Complete CRM workflow capabilities with lead/deal management, status flows, data quality, and governance.

| Item | Status |
|---|---|
| Backend: Add 15 CRM workflow fields (contacted_at, assigned_at, last_activity_date, loss_reason, closed_at, owner_id, last_updated_by, outcome, next_action_date, resolved_at, resolution_notes, source_deal_id, next_follow_up_date, health_score) | Done |
| Backend: Create status_flows.py with Lead, Deal, Ticket transition maps | Done |
| Backend: Create Alembic migration 0017_crm_sop_workflow_fields.py | Done |
| Backend: Create lead_workflows.py service (duplicate detection, scoring, stale identification, distribution) | Done |
| Backend: Create deal_workflows.py service (stage validation, stale alerts, close operations) | Done |
| Backend: Create data_quality.py service (CRM data health assessment) | Done |
| Backend: Create governance.py service (policy alerts and compliance) | Done |
| Backend: Enhance lead.py service (duplicate warning, auto-scoring, status flow validation) | Done |
| Backend: Enhance deal.py service (stage validation, audit trail tracking) | Done |
| Backend: Enhance activity.py service (auto-timestamp updates) | Done |
| Backend: Enhance ticket.py service (status flow validation, auto-timestamps) | Done |
| Backend: Enhance campaign.py service (ROI calculation) | Done |
| Backend: Enhance account.py service (health score, follow-up list) | Done |
| Backend: Enhance crm_analytics.py service (date-range filtering, sales funnel, deal velocity) | Done |
| Backend: Create workflows router with 7 endpoints (distribute, stale leads, close deal, stale deals, follow-ups, data quality, governance alerts) | Done |
| Backend: Enhance leads.py router (duplicate warning header) | Done |
| Backend: Enhance deals.py router (audit trail tracking) | Done |
| Backend: Enhance analytics.py router (date_from/date_to params) | Done |
| Frontend: Create deal-close-dialog component | Done |
| Frontend: Create lead-distribute-dialog component | Done |
| Frontend: Create stale-deals-alert component | Done |
| Frontend: Create sales-funnel-chart component | Done |
| Frontend: Create use-governance-alerts hook | Done |
| Frontend: Update 5 hooks with new fields | Done |
| Frontend: Create 4 new query/mutation hooks | Done |
| Frontend: Enhance CRM dashboard with governance alerts, sales funnel, deal velocity | Done |
| Frontend: Update deal card with stale indicator | Done |
| Frontend: Update deal form with loss_reason field | Done |
| Frontend: Update ticket form with resolution_notes field | Done |
| Frontend: Update account detail with health score badge | Done |

---

## Phase 13 — PMS Agile/Kanban + Project Type Classification (Complete)

Sprint management, agile workflow, project type classification, and burndown/velocity analytics.

| Item | Status |
|---|---|
| Backend: Create Sprint model with status lifecycle (planning/active/completed) | Done |
| Backend: Create Alembic migration 0018_add_sprints_and_agile_fields.py | Done |
| Backend: Add project_type column to Project (basic/kanban/agile) | Done |
| Backend: Add agile fields to Task (story_points, task_type, sprint_id, epic_id) | Done |
| Backend: Add wip_limit to Section for Kanban column limits | Done |
| Backend: Create SprintResponse schema with task count and points rollup | Done |
| Backend: Create sprint_analytics.py service (burndown, velocity calculations) | Done |
| Backend: Create sprints router with CRUD + lifecycle (start, complete) endpoints | Done |
| Backend: Implement one-active-sprint constraint per project | Done |
| Backend: Create backlog endpoint (tasks without sprint) | Done |
| Backend: Create burndown endpoint (daily remaining points) | Done |
| Backend: Create velocity endpoint (completed points per sprint) | Done |
| Frontend: Create ProjectTypeSelector component (3-card picker for basic/kanban/agile) | Done |
| Frontend: Update create-project-dialog with ProjectTypeSelector | Done |
| Frontend: Update project-header with conditional tabs by project_type | Done |
| Frontend: Create use-sprints hook with CRUD and lifecycle mutations | Done |
| Frontend: Create use-backlog-tasks hook | Done |
| Frontend: Create use-sprint-analytics hook (burndown + velocity queries) | Done |
| Frontend: Create SprintSelector component (dropdown with status badges) | Done |
| Frontend: Create SprintManageDialog (create, start, complete sprints) | Done |
| Frontend: Create BurndownChart component (recharts line chart with ideal line) | Done |
| Frontend: Create VelocityChart component (recharts bar chart with avg) | Done |
| Frontend: Create SprintAnalyticsPanel composition component | Done |
| Frontend: Create BacklogPage at /pms/projects/:id/backlog (task list) | Done |
| Frontend: Create stub SprintsPage at /pms/projects/:id/sprints | Done |
| Frontend: Update board.tsx with SprintSelector and sprint-aware filtering | Done |
| Frontend: Update board-kanban-column.tsx with WIP limit display | Done |
| Frontend: Update board-task-card.tsx with story points badge and task type icon | Done |
| Frontend: Update task-detail-drawer with sprint/points/type meta rows | Done |
| Frontend: Add backlog and sprints routes to router.tsx | Done |
| Frontend: Add SprintAnalyticsPanel to overview.tsx | Done |
| Backend Tests: Create test_sprint_crud.py (create, list, get, update, delete) | Done |
| Backend Tests: Create test_sprint_lifecycle.py (start, complete, one-active constraint) | Done |
| Backend Tests: Verify backlog endpoint and agile field round-trip | Done |
| Frontend Tests: Create sprint-selector.test.tsx (render, selection logic) | Done |
| Verification: All 5 phases complete with zero regressions | Done |

---

## Phase 14 — HRM SOP Compliance Implementation (Complete)

Full HRM module compliance with business logic, approval workflows, RBAC, and integrations.

| Item | Status |
|---|---|
| **Phase 1: Foundation (RBAC + Employee + Status Machines)** | |
| Backend: Add `hrm_role` column to WorkspaceMembership | Done |
| Backend: Create `require_hrm_role()` dependency in `modules/hrm/dependencies/rbac.py` | Done |
| Backend: Expand Employee model (7 fields: DOB, address, national_id, bank_account, bank_name, phone, employee_status) | Done |
| Backend: Add Department `code` column (workspace-scoped unique) | Done |
| Backend: Add Offer `contract_type` and `benefits` (JSONB) columns | Done |
| Backend: Add RecruitmentRequest `salary_range_min`/`max` and change status default to `draft` | Done |
| Backend: Create `status_transitions.py` validation helper | Done |
| Backend: Create Alembic migration 0019_hrm_phase1_rbac_employee_statuses.py | Done |
| **Phase 2: Business Logic (Workflows + Auto-calc)** | |
| Backend: Add OT rate constants to `vn_tax.py` (1.5x weekday, 2.0x weekend, 3.0x holiday) | Done |
| Backend: Create OvertimeRequest model, schema, service, router | Done |
| Backend: Create AttendanceCorrection model, schema, service, router | Done |
| Backend: Wire 7 approval state machines (recruitment, offer, payroll, leave, resignation, training, purchase_request) | Done |
| Backend: Implement payroll auto-calculation (base + allowances + OT - insurance - PIT) | Done |
| Backend: Wire leave balance validation + auto-calc business days | Done |
| Backend: Wire headcount validation on recruitment submission | Done |
| Backend: Create Alembic migration 0020_hrm_phase2_overtime_correction_models.py | Done |
| **Phase 3: Integration & UX (Email + Documents + DnD Pipeline + Org Chart)** | |
| Backend: Initialize ARQ worker pool in `main.py` lifespan | Done |
| Backend: Create `send_hrm_notification` ARQ job with HTML email support | Done |
| Backend: Wire email notifications (offer sent, leave approved/rejected, payroll published, resignation) | Done |
| Backend: Create HrmDocument model, schema, service, router (file uploads per entity) | Done |
| Backend: Add Interview model `room` and `panel_ids` (JSONB) fields | Done |
| Backend: Create Alembic migration 0021_hrm_phase3_documents_interview_fields.py | Done |
| Frontend: Create CandidatePipelineBoard with 7-stage DnD kanban (applied→hired) | Done |
| Frontend: Create VisualOrgChart with box-and-line hierarchical layout | Done |
| Frontend: Extract CandidateDetailPanel to separate file (200-line compliance) | Done |
| Frontend: Remove dead code (arq_pool.py) | Done |
| All migrations applied and tested | Done |
| All endpoints wired and routers registered | Done |
| Email notifications working with html.escape for security | Done |

---

## Phase 15 — PMS Product Documentation & Guide Content (Complete)

Comprehensive Product Requirements Document (PRD) and Standard Operating Procedures (SOP) for Project Management System.

| Item | Status |
|---|---|
| Documentation: Create PMS_PRD.md (605 lines with 16 data models, 10 API groups, 5 user roles) | Done |
| Documentation: Create SOP_PMS.md (169 lines with 10 sections for operational procedures) | Done |
| Documentation: Create HTML guide rendering (`docs/prd-pms.html`, 2004 lines, 84KB) | Done |
| Documentation: Update frontend guide TOC config (`guide-toc-pms.ts`) with 9 section groups (3 PMS + 3 CRM + 3 HRM) | Done |
| Documentation: Vietnamese-language SOP aligned with HRM and WSM documentation | Done |
| Documentation: Verify all product features match implementation status | Done |
| Documentation: Update project changelog and roadmap | Done |

---

## Phase 16 — PMS Improvement Implementation (Complete)

Comprehensive implementation of 38 user stories across 4 priority tiers addressing audit-identified gaps.

---

## Phase 17 — CRM Improvement Implementation (Complete)

Comprehensive implementation of 30 user stories across 4 priority tiers (17 gaps total) addressing audit-identified issues in lead management, deal pipeline, data quality and governance.

| Item | Status |
|---|---|
| **Phase 1: P0 Critical Gaps** — Fix RBAC, member management, project list, rich-text comments (30 SP) | Done |
| Backend: Fix project edit RBAC (owner requirement) | Done |
| Backend: Add activity logging on project updates | Done |
| Backend: Add `is_archived` + `visibility` filters to GET /projects | Done |
| Frontend: Add subtask progress counter to board cards | Done |
| Backend: Create member CRUD service with min-owner constraint | Done |
| Backend: Create members router (invite, update role, remove member) | Done |
| Frontend: Create member management panel in project settings | Done |
| Backend: Verify RBAC on all PMS routers + workspace admin override | Done |
| Frontend: Create PermissionGate component for conditional rendering | Done |
| Frontend: Create projects list page with search, filters | Done |
| Frontend: Add description textarea + task type selector to task creation | Done |
| Frontend: Replace comment textarea with Tiptap editor + edit/delete | Done |
| **Phase 2: P0 Dashboard APIs** — Cross-project aggregation endpoints (16 SP) | Done |
| Backend: Create dashboard service with KPI aggregation (total, completed, overdue, active sprints) | Done |
| Backend: Create dashboard router endpoint GET /pms/dashboard | Done |
| Frontend: Connect pms-dashboard.tsx to real API + add task distribution chart | Done |
| Frontend: Add burndown mini-chart to dashboard | Done |
| Backend: Create my-tasks endpoint GET /pms/my-tasks with filters | Done |
| Frontend: Refactor my-tasks.tsx to group by project + add filters/sorts | Done |
| Frontend: Create search highlight component for keyword matches | Done |
| **Phase 3: P1 Feature Gaps** — Dependencies, tags CRUD, archive, upload (23 SP) | Done |
| Backend: Create dependency service with circular detection (DFS) | Done |
| Backend: Create dependencies router with CRUD endpoints | Done |
| Frontend: Add dependency selector in task detail drawer | Done |
| Frontend: Add "Blocked by X" badge on task cards | Done |
| Frontend: Add dependency arrows in timeline view | Done |
| Backend: Add PATCH/DELETE endpoints for tag management | Done |
| Frontend: Create tag management page with full CRUD | Done |
| Frontend: Display tag chips on board task cards + add tag filter | Done |
| Frontend: Add restore button for archived projects + archived filter | Done |
| Backend: Add overdue count + completion rate to project stats | Done |
| Frontend: Display stats KPI cards | Done |
| Frontend: Add drag-drop upload zone to task attachments | Done |
| **Phase 4: P2 Enhancements** — WIP limits, follow, calendar/timeline (12 SP) | Done |
| Backend: Add WIP limit soft warning on task move | Done |
| Frontend: Display WIP counter on section headers + red highlight | Done |
| Backend: Create follow/unfollow endpoints | Done |
| Frontend: Follow/Unfollow toggle + follower count in task detail | Done |
| Backend: Add date range filter params to tasks endpoint | Done |
| Frontend: Add week/day toggle to calendar + drag-to-reschedule | Done |
| Frontend: Add dependency arrows between task bars in timeline | Done |
| Frontend: Add zoom controls (day/week/month) to timeline | Done |
| **Overall Results** | |
| All 38 user stories mapped to implementation status | Done |
| 36/38 stories fully done (US-001, US-009 partially - icon selector, dialog richness) | Done |
| 4 phases delivered: P0 Critical → P0 APIs → P1 Features → P2 Enhancements | Done |
| User stories status table updated in docs/userstories/user-storie-pms.md | Done |
| Project changelog updated with complete feature list | Done |

---

## Phase 17 — CRM Improvement Implementation (Complete)

Comprehensive CRM module implementation of 30 user stories across 4 priority tiers (17 gaps total) addressing audit-identified issues.

| Item | Status |
|---|---|
| **Phase 1: P0 Critical Gaps** — Fix lead scoring, duplicates, conversion, pipeline DnD, RBAC (31 SP) | Done |
| Backend: Activity-based lead scoring (activity creation trigger, auto-cap 100) | Done |
| Backend: Lead duplicate detection + merge endpoint (case-insensitive email check) | Done |
| Backend: Lead-to-deal conversion form (auto-create contact, deal params from request) | Done |
| Frontend: Pipeline kanban with @dnd-kit (5+ columns, weighted values, owner filter) | Done |
| Backend: RBAC audit + workspace admin override, My Leads filter toggle | Done |
| **Phase 2: P0/P1 High** — Auto probability, stale leads, campaigns, follow-ups (15 SP) | Done |
| Frontend: Auto probability suggestion on stage change (Qualified 10%-75% mapping) | Done |
| Backend: Stale lead detection fix (30-day activity-based, not contacted_at) | Done |
| Frontend: Campaign detail page with KPI cards (leads, cost per lead, conversion, ROI) | Done |
| Frontend: Follow-ups due widget on CRM dashboard (overdue red indicators) | Done |
| Frontend: Stale deals alerts clickable to filtered deals list | Done |
| **Phase 3: P1 Feature Gaps** — Data quality, velocity, ticket KPIs, governance (16 SP) | Done |
| Frontend: Data quality report page (score gauge, duplicates, missing fields, stale records) | Done |
| Backend: Deal velocity analytics (avg days per stage from timestamps) | Done |
| Frontend: Deal velocity bar chart with bottleneck highlight | Done |
| Backend: Ticket stats endpoint (avg resolution time, rate, by priority) | Done |
| Frontend: Ticket KPI cards component with priority distribution | Done |
| Backend: Governance alerts response with missing values + high-value no-activity | Done |
| Frontend: Governance alerts drill-down (clickable categories to filtered lists) | Done |
| **Phase 4: P2 Enhancements** — Pipeline config, scoring config, code quality (11 SP) | Done |
| Backend: PipelineStage model + CRUD + reorder endpoints (admin-only) | Done |
| Frontend: Pipeline settings page with drag-to-reorder (@dnd-kit/sortable) | Done |
| Backend: ScoringConfig model (workspace JSONB) + get/update endpoints | Done |
| Frontend: Scoring settings page with editable rules + thresholds | Done |
| Backend: Replace datetime.utcnow() → datetime.now(timezone.utc) in 6 files | Done |
| Backend: Escape ILIKE wildcards via escape_like() helper in 7 files | Done |
| Backend: Fix close deal endpoint to use request body (DealCloseRequest) | Done |
| Backend: Enforce campaign status flow (draft → active → completed/cancelled) | Done |
| Backend: Add Literal type validation on all schemas (stage, status, priority, source, type) | Done |
| Backend: Fix governance stale leads call (hours=48 → days=30) | Done |
| **Overall Results** | |
| All 30 user stories fully implemented (17 gaps resolved) | Done |
| 4 phases delivered: P0 Critical → P0/P1 High → P1 Features → P2 Enhancements | Done |
| User stories status updated in docs/userstories/user-storie-crm.md | Done |
| Project changelog updated with CRM improvement entry | Done |
