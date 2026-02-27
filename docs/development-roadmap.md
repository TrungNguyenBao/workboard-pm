# WorkBoard — Development Roadmap

**Last updated:** 2026-02-27

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
