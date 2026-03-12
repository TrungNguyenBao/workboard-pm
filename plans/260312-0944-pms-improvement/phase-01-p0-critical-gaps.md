# Phase 1: P0 Critical Gaps

**Priority:** P0 Critical | **Est:** ~30 SP | **Status:** ✅ Complete

---

## Context
- [Audit Report](../reports/pms-audit-260312-0925-consolidated.md)
- [Improvement Plan](../reports/pms-improvement-plan-260312-0925.md)

## Overview
Fix all P0 missing/partial stories. System unusable for real teams without these.

## Tasks

### Quick Wins (~5 SP)

- [x] **1.4a** Fix project edit RBAC: change `require_project_role("editor")` → `require_project_role("owner")` in `backend/app/modules/pms/routers/projects.py`
- [x] **1.4b** Add `create_activity()` call in `update_project()` in `backend/app/modules/pms/services/project.py`
- [x] **1.3a** Add `is_archived` + `visibility` query params to `GET /projects` in service + router
- [x] **1.6** Add subtask progress counter ("2/5") to `board-task-card.tsx`

### 1.1 US-005: Project Member Management (~8 SP)

**Backend:**
- [x] Create `backend/app/modules/pms/schemas/member.py` — request/response schemas
- [x] Create `backend/app/modules/pms/services/member.py` — CRUD + min-owner constraint
- [x] Create `backend/app/modules/pms/routers/members.py` — CRUD endpoints
- [x] Register router in `backend/app/modules/pms/router.py`

**Frontend:**
- [x] Create `frontend/src/modules/pms/features/projects/components/member-management-panel.tsx`
- [x] Integrate into `project-settings-dialog.tsx`

### 1.2 US-034: RBAC Permission-Based UI (~8 SP)

**Backend:**
- [x] Audit all PMS routers for correct role requirements
- [x] Add workspace admin override consistently in `dependencies/rbac.py`

**Frontend:**
- [x] Create `frontend/src/modules/pms/features/projects/hooks/use-project-permissions.ts`
- [x] Create `frontend/src/shared/components/permission-gate.tsx`
- [x] Apply permission gates across board, task detail, project settings

### 1.3 US-002: Project List Page (~3 SP)

**Frontend:**
- [x] Create `frontend/src/modules/pms/features/projects/pages/projects-list.tsx`
- [x] Card/grid layout, filter dropdowns, search bar
- [x] Register route in router

### 1.5 US-009: Task Create Enhancements (~2 SP)

**Frontend:**
- [x] Add description textarea to task create form/dialog
- [x] Add task type selector (task/bug/story/epic)

### 1.7 US-028: Rich-Text Comments (~5 SP)

**Frontend:**
- [x] Replace plain textarea with Tiptap editor
- [x] Add edit action on own comments
- [x] Add "edited" indicator

## Success Criteria
- All P0 user stories pass acceptance criteria
- RBAC enforced on all PMS endpoints
- Member management fully functional
- Projects list page with filters working
