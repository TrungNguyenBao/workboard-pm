# Phase 4: P2 Enhancements

**Priority:** P2 Low | **Est:** ~12 SP | **Status:** ✅ Complete

---

## Context
- [Phase 3](phase-03-p1-feature-gaps.md) should complete first
- [Audit Report](../reports/pms-audit-260312-0925-consolidated.md)

## Tasks

### 4.1 US-008: WIP Limit Enforcement (~3 SP)

**Backend:**
- [x] Add soft warning check when moving task to section at/over wip_limit

**Frontend:**
- [x] Display counter (e.g., "3/5") on section header
- [x] Red highlight when task count exceeds limit

### 4.2 US-015: Follow Task (~3 SP)

**Backend:**
- [x] Create follow/unfollow endpoints (`POST/DELETE /tasks/{id}/followers`)

**Frontend:**
- [x] Follow/Unfollow toggle button in task detail
- [x] Follower count display

### 4.3 US-037: Calendar View Enhancements (~3 SP)

**Backend:**
- [x] Add date range filter params to tasks endpoint

**Frontend:**
- [x] Add week/day toggle to calendar
- [x] Add drag-to-reschedule (PATCH due_date on drop)

### 4.4 US-038: Timeline/Gantt Enhancements (~3 SP)

**Frontend:**
- [x] Add dependency arrows between task bars
- [x] Add zoom controls (day/week/month)

## Success Criteria
- WIP limits displayed with visual warnings
- Follow/unfollow working with follower count
- Calendar supports week/day views with drag reschedule
- Timeline shows dependency arrows with zoom controls
