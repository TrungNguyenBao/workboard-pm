# Phase 2: P0 Dashboard APIs

**Priority:** P0 High | **Est:** ~16 SP | **Status:** ✅ Complete

---

## Context
- [Phase 1](phase-01-p0-critical-gaps.md) must complete first
- [Audit Report](../reports/pms-audit-260312-0925-consolidated.md)

## Tasks

### 2.1 US-035: PMS Dashboard API (~8 SP)

**Backend:**
- [x] Create `backend/app/modules/pms/services/dashboard.py` — aggregation logic
- [x] Create `backend/app/modules/pms/routers/dashboard.py` — `GET /pms/dashboard`
- [x] KPI: total tasks, completed, overdue, active sprints
- [x] Task distribution by project + priority

**Frontend:**
- [x] Connect `pms-dashboard.tsx` to real dashboard API
- [x] Add task distribution chart (bar/pie)
- [x] Add burndown mini-chart

### 2.2 US-036: My Tasks API (~5 SP)

**Backend:**
- [x] Add `GET /pms/my-tasks` endpoint
- [x] Query params: priority, sort, group_by

**Frontend:**
- [x] Refactor `my-tasks.tsx` — group by project instead of time buckets
- [x] Add filter controls: priority, status, due date range
- [x] Add sort controls

### 2.3 US-017: Search Highlight (~3 SP)

**Frontend:**
- [x] Create search highlight component
- [x] Apply to search results in filter/search bar

## Success Criteria
- Dashboard shows real KPI data from API
- My Tasks groups by project with working filters
- Search results highlight matching keywords
