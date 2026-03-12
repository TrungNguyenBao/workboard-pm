# Phase 3: P1 Feature Gaps

**Priority:** P1 Medium | **Est:** ~23 SP | **Status:** ✅ Complete

---

## Context
- [Phase 2](phase-02-p0-dashboard-apis.md) should complete first
- [Audit Report](../reports/pms-audit-260312-0925-consolidated.md)

## Tasks

### 3.1 US-013: Task Dependencies (~8 SP)

**Backend:**
- [x] Create `backend/app/modules/pms/services/dependency.py` — circular check (DFS)
- [x] Create `backend/app/modules/pms/routers/dependencies.py` — CRUD endpoints
- [x] Create `backend/app/modules/pms/schemas/dependency.py`

**Frontend:**
- [x] Add dependency selector in task detail drawer
- [x] Add "Blocked by X" badge on task cards
- [x] Add dependency arrows in timeline view

### 3.2 US-033: Tag Management CRUD (~3 SP)

**Backend:**
- [x] Add `PATCH /tags/{id}` and `DELETE /tags/{id}` endpoints

**Frontend:**
- [x] Create tag management page with CRUD UI

### 3.3 US-014: Tags on Task Cards (~2 SP)

**Frontend:**
- [x] Display tag chips on `board-task-card.tsx`
- [x] Add tag filter to `filter-bar.tsx`

### 3.4 US-004: Archive/Restore (~2 SP)

**Frontend:**
- [x] Add restore button for archived projects
- [x] Add archived filter toggle in projects list

### 3.5 US-006: Project Stats Enhancement (~3 SP)

**Backend:**
- [x] Add overdue count + completion rate to stats endpoint

**Frontend:**
- [x] Display full KPI cards

### 3.6 US-029: Drag-Drop Upload (~5 SP)

**Frontend:**
- [x] Add drag-and-drop upload zone to task detail attachments

## Success Criteria
- Task dependencies with circular check working
- Tag CRUD page functional
- Tags visible on board cards with filter
- Archive/restore flow complete
- Stats show overdue + completion rate
