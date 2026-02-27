# WorkBoard — Project Changelog

All significant changes, features, and fixes are recorded here.
Format: `## [version] — YYYY-MM-DD` with grouped entries.

---

## [Unreleased] — 2026-02-27

### Added
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
