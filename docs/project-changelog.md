# A-ERP — Project Changelog

All significant changes, features, and fixes are recorded here.
Format: `## [version] — YYYY-MM-DD` with grouped entries.

---

## [Unreleased] — 2026-03-12

### Added — CRM Improvement Implementation (Phases 1-4, 30 User Stories)

**Phase 1: P0 Critical Gaps (Lead Scoring, Duplicates, Conversion, Pipeline DnD, RBAC)**
- Activity-based lead scoring: Automatically calculate score on activity creation (email_open +5, click +10, form +15, call +15, demo +20, meeting +20, note +2). Auto-cap at 100. Add score level badges (Cold 0-30, Warm 30-60, Hot 60+).
- Lead duplicate detection & merge: Case-insensitive email matching with merge endpoint. Return duplicates in creation response. UI modal for side-by-side comparison with merge/create/cancel actions.
- Lead-to-deal conversion form: Auto-create contact from lead data if not exists. Accept deal title, value, expected_close_date from request body. Support lead status transition to Opportunity.
- Pipeline kanban drag-drop: Full @dnd-kit integration with 5+ columns, deal count + total value + weighted value per column. Owner filter dropdown for pipeline view.
- RBAC audit + My Leads toggle: Workspace admin override, My Leads filter to show only assigned leads.

**Phase 2: P0/P1 High (Auto Probability, Stale Leads, Campaigns, Follow-ups)**
- Auto probability on stage change: Suggest probability based on deal stage (Qualified 10%, Needs Analysis 25%, Proposal 50%, Negotiation 75%). Allow manual override.
- Stale lead detection fix: Use 30-day activity-based criteria (check Activity.lead_id for most recent date, fallback to contacted_at then created_at). Add disqualify endpoint with reason.
- Campaign detail page: KPI cards (total leads, cost per lead, conversion rate, ROI). useCampaignStats hook for performance tracking.
- Follow-ups due widget: Dashboard widget showing overdue accounts with red indicator. Alert system for expired next_follow_up_date.
- Stale deals navigation: Make stale alerts clickable to navigate to filtered deals list. Add new alert categories: missing_deal_values, high_value_no_activity.

**Phase 3: P1 Feature Gaps (Data Quality, Velocity, Ticket KPIs, Governance)**
- Data quality report page: Quality score gauge (0-100). Sections for duplicates, missing fields, stale records, ownerless deals. Action buttons per section.
- Deal velocity analytics: Calculate avg days per stage from deal stage timestamps. Bar chart with bottleneck highlight (longest stage). Group by owner for comparison.
- Ticket KPIs: Endpoint returns avg resolution time, resolution rate, breakdown by priority. Dashboard cards for ticket metrics.
- Governance alerts drill-down: Each alert category clickable to navigate to affected records list. Add missing_deal_values, high_value_no_activity alert categories.

**Phase 4: P2 Enhancements (Pipeline Config, Scoring Config, Code Quality)**
- Pipeline stage configuration: PipelineStage model (name, position, default_probability, workspace_id). Full CRUD + reorder endpoints. Admin-only mutations. Settings page with drag-to-reorder and inline editing.
- Lead scoring rules configuration: ScoringConfig model (workspace-level JSONB). Get/update endpoints with defaults fallback. Settings page with editable rules table (activity_type → points). Threshold config (Cold max, Warm max).
- Code quality improvements: Replace datetime.utcnow() with datetime.now(timezone.utc) across 6 files. Escape ILIKE wildcards via escape_like() helper in 7 files. Fix close deal endpoint to use DealCloseRequest body. Enforce campaign status flow (draft → active → completed/cancelled). Add Literal type validation on all schemas. Fix governance stale leads call (hours=48 → days=30).

### Details
- Total 30 CRM user stories fully implemented (17 gaps resolved from audit)
- 4 phases: P0 Critical (31 SP) → P0/P1 High (15 SP) → P1 Features (16 SP) → P2 Enhancements (11 SP)
- All acceptance criteria passed; user stories marked complete in docs/userstories/user-storie-crm.md
- Development roadmap Phase 17 added with comprehensive status tracking
- Backend: 8 new endpoints, 2 new models, 4 enhanced services, 12+ code quality fixes
- Frontend: 7 new components, 5 enhanced hooks, 3 new settings pages, full kanban + drag-drop support

---

### Added

- Project member management (US-005): Full CRUD API + UI panel in project settings
- RBAC permission-based UI (US-034): PermissionGate component, role-based button visibility
- Projects list page (US-002): Dedicated page with search, visibility/archived filters
- Dashboard API (US-035): Cross-project KPI aggregation endpoint
- My Tasks API (US-036): Cross-project assignee query with filters/sort
- Task dependencies (US-013): CRUD with BFS circular detection, "Blocked" badge
- Tag management page (US-033): Full CRUD at /pms/tags
- Follow task (US-015): Follow/unfollow toggle with follower count
- Rich-text comments (US-028): Tiptap editor with edit/delete actions
- Drag-drop file upload (US-029): AttachmentDropZone component
- Search keyword highlight (US-017): TextHighlight component
- Calendar week/day views (US-037): View toggle + drag-to-reschedule
- Timeline dependency arrows (US-038): SVG overlay with zoom controls
- Subtask progress bar (US-012): Visual counter + indent hierarchy

### Fixed

- Project edit RBAC: Changed from editor to owner requirement
- Activity logging on project updates
- Default is_archived=false filter on project list
- Overdue count + completion rate in project stats
- Comment XSS prevention via DOMPurify sanitization
- Last owner demotion prevention in member management

### Changed

- Sprint/custom field management restricted to owner role
- Tags now display as chips on board task cards
- My Tasks groups by project instead of time buckets

---

## [2.6.0] — 2026-03-11

### Added — PMS Product Documentation & Guide Content

**Documentation & Content Systems**
- **PMS_PRD.md** — Comprehensive Product Requirements Document (605 lines) covering 16 data models, 10 API endpoint groups, and 5 user roles with detailed specifications for Projects, Tasks, Sprints, Goals, Custom Fields, and Collaboration features.
- **SOP_PMS.md** — Standard Operating Procedures document (169 lines) in Vietnamese with 10 sections detailing: project setup workflows, task management, Kanban operations, Agile/Sprint planning, goal tracking, and team collaboration guidelines.
- **HTML Guide Rendering** — `docs/prd-pms.html` (2004 lines, 84KB) provides web-accessible PRD with styled markup for guides system.
- **Updated Guide TOC** — Frontend `guide-toc-pms.ts` configuration now includes 9 section groups: 3 PMS sections + 3 CRM sections + 3 HRM sections with proper nesting and navigation structure.

### Details
- PMS_PRD.md documents all production-ready features: Projects, Tasks (with recurring/custom fields), Sprints, Epics, Goals, Activities, Comments, and comprehensive RBAC
- SOP_PMS.md provides step-by-step operational guidelines for workspace admins, project owners, editors, commenters, and viewers
- Guide content integrates with system-wide SOP/PRD documentation strategy for HRM (Phase 14) and CRM (Unreleased)
- All documentation follows codebase architectural patterns and naming conventions
- Vietnamese-language SOP aligns with HRM and WSM (Warehouse) documentation in same language

---

## [2.5.0] — 2026-03-09

### Added — HRM SOP Compliance (Phases 1-3)

**Phase 1: Foundation (RBAC + Employee Model + Status Machines)**
- **HR RBAC System** — `hrm_role` column added to `WorkspaceMembership` with ranks: `line_manager` (1), `hr_manager` (2), `hr_admin` (3), `ceo` (4). Workspace admins bypass HRM role checks. Created `require_hrm_role()` dependency in `backend/app/modules/hrm/dependencies/rbac.py`.
- **Employee Model Expansion** — 7 new fields: `date_of_birth`, `address`, `national_id`, `bank_account_number`, `bank_name`, `phone`, plus `employee_status` enum (`active`/`inactive`/`probation`).
- **Department Code** — Added workspace-scoped unique `code` column (e.g., "KY_THUAT", "SALES").
- **Offer Model Enhancement** — Added `contract_type` (e.g., `full_time`, `part_time`, `contractor`) and `benefits` (JSONB).
- **RecruitmentRequest Salary Range** — Added `salary_range_min` and `salary_range_max` (Numeric). Changed default status from `open` to `draft`.
- **Status Transition Helper** — `status_transitions.py` service with `validate_transition()` function for reusable workflow validation.
- **Alembic Migration 0019** — Applied successfully with backward-compatible nullable columns and defaults.

**Phase 2: Business Logic (Workflows + Auto-calculation)**
- **OT Rate Constants** — Added to `vn_tax.py`: `OT_RATE_WEEKDAY = 1.5`, `OT_RATE_WEEKEND = 2.0`, `OT_RATE_HOLIDAY = 3.0`. New `calculate_ot_pay()` function for rate-based payroll calculations.
- **OvertimeRequest Model** — Full CRUD + approval workflow (`pending` → `approved`|`rejected`). Tracks employee, date, planned hours, approval timestamp, and approver.
- **AttendanceCorrection Model** — Full CRUD + approval workflow. On approval, applies correction to original AttendanceRecord and recalculates daily hours.
- **7 Approval State Machines**:
  - **Recruitment**: `draft` → `submitted` → `hr_approved` → `ceo_approved` | `rejected` (legacy `open` compat)
  - **Offer**: `draft` → `hr_approved` → `sent` → `accepted` | `rejected`
  - **Payroll**: `draft` → `reviewed` → `approved` → `paid`
  - **Leave**: Validates balance; auto-calculates business days
  - **Resignation**: `pending` → `approved` → `handover` → `exit_interview` → `completed` (marks employee inactive on completion)
  - **Training**: `planned` → `approved` → `in_progress` → `completed` | `cancelled`
  - **Purchase Request**: Threshold-based approval (< 5M: line_manager, < 20M: hr_admin, >= 20M: ceo)
- **Payroll Auto-calculation** — Integrated contract base salary + attendance summary + OT rates + vn_tax breakdown. All fields auto-populated from existing data.
- **Leave Balance Validation** — Prevents approval if insufficient leave balance. Auto-calculates days from date range if null.
- **Headcount Validation** — Recruitment request submission validates requested quantity against department headcount limits.
- **Alembic Migration 0020** — Creates `overtime_requests` and `attendance_corrections` tables. Adds `ot_pay` and `dependents` columns to `payroll_records`.

**Phase 3: Integration & UX (Email + Documents + DnD Pipeline + Org Chart)**
- **ARQ Worker Pool** — Initialized in `main.py` lifespan event. Redis connection configured in `core/config.py`.
- **Email Notifications** — New `send_hrm_notification` ARQ job in `worker/tasks.py`. HTML email support with `html.escape()` for XSS prevention. Email triggers:
  - Offer sent (to candidate)
  - Leave approved/rejected (to employee)
  - Payroll published (to employee)
  - Resignation status changes (to employee)
- **HrmDocument Model** — Tracks uploaded files per entity (`employee`, `recruitment_request`, `contract`). Stores filename, path, size, mime_type, uploader. Indexed on `(entity_type, entity_id)` and `workspace_id`.
- **Document Upload Router** — `POST /documents` (multipart/form-data), `GET /documents?entity_type=&entity_id=`, `DELETE /documents/{id}`. File size limit: 10MB. MIME validation (pdf, png, jpg, doc, docx).
- **Interview Model Fields** — Added `room` (VARCHAR(100)) for meeting location and `panel_ids` (JSONB) for array of interviewer UUIDs.
- **CandidatePipelineBoard** — Drag-and-drop kanban with 7 stages: `applied` → `screening` → `assessment` → `interviewing` → `offered` → `hired` | `rejected`. Reuses `@dnd-kit` pattern from PMS board.
- **VisualOrgChart** — Box-and-line hierarchical tree layout using CSS flexbox + pseudo-elements. Displays department name, code, headcount, manager. List/Org Chart view toggle.
- **CandidateDetailPanel Extraction** — Split to separate file maintaining 200-line compliance.
- **Dead Code Removal** — Removed unused `arq_pool.py` file.
- **Alembic Migration 0021** — Creates `hrm_documents` table. Adds `room` and `panel_ids` columns to `interviews`.

### Changed
- All HRM routers now respect `require_hrm_role()` dependency for action endpoints
- Email bodies use LeaveType name resolution instead of UUID references
- LeaveType response includes name field for email template rendering

### Security
- HTML email escaping prevents XSS injection in notification bodies
- Document upload MIME type validation prevents script execution
- Panel IDs validated as list of valid user UUIDs before persistence
- File upload path sanitization prevents directory traversal

### Backward Compatibility
- All new model fields are nullable or have sensible defaults
- RecruitmentRequest status change (`open` → `draft`) doesn't affect existing records with `open` status
- Legacy `open` status supported in recruitment transition map

### New Dependencies
None — leverages existing ARQ, SQLAlchemy, and Pydantic.

---

## [2.4.0] — 2026-03-05

### Added — Full UI Overhaul (Phases 1-8)

- Dark mode support across all pages and components
- Dark mode toggle (System/Light/Dark) in shell header
- Shared `DataTable` component with TanStack Table (sorting, selection, skeleton, empty state)
- Shared `PageHeader`, `PaginationControls`, `Breadcrumb`, `EmptyState`, `SkeletonTable`, `KpiCard` components
- Module dashboards for PMS, WMS, HRM, CRM with KPI cards and Recharts bar charts
- Sidebar collapse-to-icons mode with Zustand-persisted state
- Module switcher moved into sidebar (replaces header strip)
- Breadcrumbs in shell header for all routes
- `my-tasks-row.tsx` and `my-tasks-bucket.tsx` sub-components (split from my-tasks.tsx)
- Entrance animations on auth pages (staggered slide-up-fade)
- Dashboard routes: `/pms/dashboard`, `/wms/dashboard`, `/hrm/dashboard`, `/crm/dashboard`

### Changed

- Sidebar split from 421-line monolith into 6 focused files (sidebar-workspace-picker, sidebar-module-switcher, sidebar-navigation, sidebar-project-nav-item, sidebar-user-footer)
- All shell components now use semantic CSS tokens (bg-background, bg-muted, text-foreground, etc.)
- My Tasks page: loading skeleton + shared EmptyState
- Project header simplified (removed duplicate search/bell now in shell header)
- Goals page: uses shared EmptyState
- All 11 WMS/HRM/CRM list pages migrated to shared DataTable + PageHeader + PaginationControls
- Recharts charts use dark-compatible neutral colors
- Full prefers-reduced-motion support added to index.css

### Removed

- 9 duplicate module-specific components: wms/hrm/crm-data-table, wms/hrm/crm-page-header, wms/hrm/crm-pagination
- module-switcher.tsx (replaced by sidebar-module-switcher.tsx)
- Hardcoded bg-white/bg-neutral-50/text-neutral-900 across 30+ components

### New Dependencies

- `@tanstack/react-table` — headless data table
- `recharts` — charts for dashboards

---

## [2.3.0] — 2026-03-04

### Added — Seed Demo Data Restructure & Extension

- **Modular Seed Architecture** — Restructured monolithic `backend/scripts/seed.py` (675 lines) into modular files under `backend/app/scripts/` to support scalable data seeding. Entry point: `__main__.py` orchestrates all modules.
- **Seed Module Structure** — Each seed module exports `async def seed_xxx(session, ws_id, ...) -> dict` for composition:
  - `seed_shared.py` (75 lines) — Users, workspace, memberships, DB engine, helpers, TRUNCATE_TABLES
  - `seed_pms.py` + `seed_pms_setup.py` + `seed_pms_tasks.py` + `seed_pms_extras.py` (split to 200-line limit) — Projects, sections, tasks, tags, comments, goals, custom fields, followers
  - `seed_crm.py` (80 lines) — Contacts, deals
  - `seed_wms.py` (new, 180+ lines) — Warehouses, products, suppliers, devices, inventory
  - `seed_hrm.py` (new, 180+ lines) — Departments, employees, leave types, leave requests, payroll
- **WMS Seed Data** — 2 Vietnamese warehouses (Ho Chi Minh + Hanoi), 6 products (laptops, monitors, keyboards, mice, cables, paper), 3 suppliers, 8 serial-tracked devices, 6 inventory items with quantities and thresholds.
- **HRM Seed Data** — 4 Vietnamese departments (Ky Thuat, Marketing, Nhan Su, Kinh Doanh), 8 employees (3 linked to app users demo/alice/bob, 5 Vietnamese staff), 4 leave types (Annual, Sick, Maternity, Unpaid), 6 leave requests (mix of past/future, approved/pending/rejected), 16 payroll records (2 months × 8 employees) with realistic VND salaries and deductions (bhxh, bhyt, tncn).
- **TRUNCATE_TABLES Update** — Now includes all WMS and HRM tables: `payroll_records`, `leave_requests`, `leave_types`, `employees`, `departments`, `inventory_items`, `wms_devices`, `wms_products`, `wms_suppliers`, `warehouses` (plus existing PMS/CRM tables).
- **All Files <200 Lines** — Respects codebase standard. Longest files: seed_pms.py (~150 lines), seed_wms.py (~180 lines), seed_hrm.py (~180 lines).
- **Vietnamese-Friendly Data** — Employee names, department names, supplier names all in Vietnamese. Product names include Vietnamese descriptions. Payroll uses Vietnamese deduction labels (bhxh, bhyt, tncn).
- **Idempotent Execution** — `make seed` can run multiple times without errors. TRUNCATE CASCADE clears all data before insert.

### Fixed
- **Module Path Consistency** — `Makefile` runs `cd backend && uv run python -m app.scripts.seed` which correctly resolves to `app/scripts/__main__.py` (previously would have failed with old `backend/scripts/seed.py`).

---

## [2.2.0] — 2026-03-03

### Added — Frontend i18n Multi-language Support (EN/VI)

- **i18next Installation** — `react-i18next` and `i18next` packages installed. Config in `frontend/src/i18n/index.ts` with namespace support for `common`, `pms`, `wms`, `hrm`, `crm`.
- **Translation Files** — 10 JSON files created (5 namespaces × 2 languages). Files: `locales/vi/{common,pms,wms,hrm,crm}.json` and `locales/en/{common,pms,wms,hrm,crm}.json`. All 500+ user-facing strings catalogued and translated.
- **Translation Integration** — All 55+ frontend components updated with `useTranslation()` hook. Hardcoded strings replaced with `t()` calls. Proper namespace handling: shared strings use `common` namespace, module-specific strings use module namespaces (prefix with `common:` when accessing common keys from module namespace).
- **Language Persistence** — Default language: Vietnamese. User preference saved to `localStorage` key `a-erp-language`. Language choice persists across page refreshes.
- **UI Language Switcher** — New `language-switcher.tsx` component with Globe icon and dropdown. Integrated into sidebar footer for quick access. Also available in settings page for discoverability.
- **Real-time Language Switching** — `i18n.changeLanguage()` triggers immediate re-render of all components using `useTranslation()`. No page reload needed.

---

## [2.1.0] — 2026-03-03

### Added — HRM Module Full Implementation

- **HRM Backend Enhancements** — Paginated endpoints for departments and employees. Department list: search by name/description. Employee list: filter by department_id, search by name/email. All responses include `created_at` and `updated_at` timestamps. Workspace-scoped with RBAC.
- **HRM New Models** — `LeaveType` (name, description), `LeaveRequest` (employee_id, leave_type_id, start_date, end_date, status='pending'/'approved'/'rejected', admin approval workflow), `PayrollRecord` (employee_id, month, salary, deductions, bonus).
- **HRM Routers** — Departments CRUD at `/hrm/workspaces/{workspace_id}/departments`. Employees CRUD at `/hrm/workspaces/{workspace_id}/employees`. LeaveRequest CRUD with approve/reject actions at `/hrm/workspaces/{workspace_id}/leave`. PayrollRecord CRUD at `/hrm/workspaces/{workspace_id}/payroll`.
- **HRM Shared Schema** — `PaginatedResponse` moved from CRM to shared `app/schemas/pagination.py` for reuse across all modules.
- **HRM Frontend Shared Components** — `HrmDataTable<T>` generic table component, `HrmPagination` with prev/next navigation, `HrmPageHeader` with title, search, create button. Located in `modules/hrm/features/shared/components/`.
- **HRM Departments Frontend** — Full CRUD UI. `useDepartments`, `useCreateDepartment`, `useUpdateDepartment`, `useDeleteDepartment` hooks with TanStack Query. Department form dialog with name, description fields. Departments list page with search and pagination. Sidebar navigation added.
- **HRM Employees Frontend** — Full CRUD UI. `useEmployees`, `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee` hooks with TanStack Query. Employee form dialog with name, email, position, hire_date, department selector fields. Employees list page with department filter, search, pagination. FK cascade on deletion.
- **HRM Leave Requests Frontend** — `useLeaveRequests`, `useCreateLeaveRequest`, `useApproveLeaveRequest`, `useRejectLeaveRequest` hooks. Leave request form dialog with date range and leave type selector. Leave requests list page with status filter, approve/reject action buttons for admins. Sidebar navigation.
- **HRM Payroll Records Frontend** — `usePayrollRecords`, `useCreatePayrollRecord`, `useUpdatePayrollRecord`, `useDeletePayrollRecord` hooks. Payroll form dialog with employee selector, month, salary, deductions, bonus fields. Payroll records list page with pagination and CRUD actions.
- **HRM Module Routes** — `/hrm/departments`, `/hrm/employees`, `/hrm/leave`, `/hrm/payroll` routes added to router. Module switcher includes HRM. Sidebar shows HRM nav items when `activeModule === 'hrm'`.
- **Alembic Migration 0007** — Creates `leave_types`, `leave_requests`, `payroll_records` tables with proper foreign keys, workspace scoping, and cascade rules on employee deletion.

### Fixed
- **Employee FK Cascade** — Employees properly cascade-deleted when deleted (leave_requests and payroll_records cascade).
- **Date Validation** — Leave request start_date must be before end_date; date range validation at service layer.
- **Pagination Schema** — Moved to shared location for DRY across CRM, WMS, HRM modules.

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

### Added — CRM SOP Workflow Operations (Phases 1-4)

**Phase 1: Models/Schemas/Migration**
- **New CRM Fields** — 15 new workflow fields added to CRM models: `contacted_at`, `assigned_at`, `last_activity_date`, `loss_reason`, `closed_at`, `owner_id`, `last_updated_by`, `outcome`, `next_action_date`, `resolved_at`, `resolution_notes`, `source_deal_id`, `next_follow_up_date`, `health_score` across Lead, Deal, Activity, Ticket, Account entities.
- **Status Flow Management** — New `status_flows.py` service with transition maps for Lead (`prospect→qualified→contacted→proposal→negotiation→won/lost`), Deal (similar pipeline), and Ticket (`open→in_progress→resolved/closed`) status flows.
- **Migration 0017** — `0017_crm_sop_workflow_fields.py` adds all workflow fields to CRM tables with proper indexing and constraints.

**Phase 2: Backend Service Logic**
- **New Workflow Services** — 4 new services: `lead_workflows.py` (duplicate detection, lead scoring, stale lead identification, round-robin distribution), `deal_workflows.py` (stage validation, stale deal alerts, close operations for won/lost), `data_quality.py` (CRM data health assessment), `governance.py` (policy alerts and compliance).
- **Enhanced Services** — 7 services updated with new capabilities: `lead.py` (duplicate warning, auto-scoring on create, status flow validation), `deal.py` (stage validation, audit trail tracking), `activity.py` (auto-update timestamps on related entities), `ticket.py` (status flow validation, auto-timestamp resolution), `campaign.py` (ROI calculation from deals), `account.py` (health score computation, follow-up list), `crm_analytics.py` (date range filtering, sales funnel, deal velocity metrics).

**Phase 3: Backend Router Updates**
- **New Workflows Router** — `/crm/workflows` with 7 endpoints: `POST /leads/distribute` (round-robin assignment), `GET /leads/stale` (leads without contact for 30+ days), `POST /deals/{id}/close` (mark won/lost), `GET /deals/stale` (deals in negotiation stage for 60+ days), `GET /accounts/follow-ups` (accounts due for contact), `GET /data-quality/report` (CRM data health), `GET /governance/alerts` (policy violations).
- **Enhanced Routers** — `leads.py` adds duplicate warning header in list response, `deals.py` tracks `last_updated_by` on mutations, `analytics.py` adds `date_from`/`date_to` query params for date-range filtering.

**Phase 4: Frontend Updates**
- **New Components** — 5 new feature components: `deal-close-dialog` (select win/loss + reason), `lead-distribute-dialog` (preview + confirm round-robin distribution), `stale-deals-alert` (banner alert with count), `sales-funnel-chart` (Recharts visualization by stage), `use-governance-alerts` hook.
- **Updated Hooks** — 5 hooks enhanced with new fields + 4 new query/mutation hooks (useDistributeLeads, useCloseDeal, useStaleDealList, useGovernanceAlerts).
- **Dashboard Enhancement** — CRM dashboard now displays governance alerts, sales funnel chart, and deal velocity KPI.
- **Forms Updated** — Deal card shows stale indicator, deal form includes `loss_reason` field, ticket form includes `resolution_notes`, account detail shows health score badge.

---

## [Unreleased]

### Added — CRM Module Full Implementation

- **CRM Backend Enhancements** — Paginated endpoints for contacts and deals. Contact list: search by name/email/company. Deal list: filter by stage and contact_id, search by title. All responses include `created_at` and `updated_at` timestamps. Admin role required for delete operations (guest=read, member=write, admin=delete).
- **CRM Frontend Shared Components** — `CrmDataTable<T>` generic table component, `CrmPagination` with prev/next navigation, `CrmPageHeader` with title, search, create button, and filter children slot. Located in `modules/crm/features/shared/components/`.
- **CRM Contacts Frontend** — Full CRUD UI. `useContacts`, `useCreateContact`, `useUpdateContact`, `useDeleteContact` hooks with TanStack Query. Contact form dialog with name, email, phone, company fields. Contacts list page with search and pagination. Sidebar navigation added.
- **CRM Deals Frontend** — Full CRUD UI. `useDeals`, `useCreateDeal`, `useUpdateDeal`, `useDeleteDeal` hooks with TanStack Query. Deal form dialog with title, value (currency), stage selector (lead/qualified/proposal/negotiation/closed_won/closed_lost), and contact dropdown selector. Deals list page with stage filter, search, and pagination. Currency formatting for deal values. Client-side contact name lookup for deal list.
- **CRM Module Routes** — `/crm/contacts` and `/crm/deals` routes added to router. `/crm` base route redirects to `/crm/contacts`.

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
