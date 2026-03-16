# Phase 3: PMS Module Responsive

## Context
- [PMS pages](../../frontend/src/modules/pms/features/)
- Depends on Phase 1 (shell) and Phase 2 (shared UI)

## Overview
- **Priority**: High
- **Status**: Completed
- **Description**: Make PMS module pages responsive — dashboard, project list, board, backlog, sprints, calendar, timeline, goals, tags.

## Key Insights
- Dashboard: already `grid-cols-2 lg:grid-cols-4` — mostly fine
- Board (Kanban): horizontal scroll for columns, needs mobile treatment
- Project list: uses DataTable — handled by Phase 2
- Calendar/Timeline: complex views, ensure horizontal scroll
- My Tasks: similar to project list

## Pages to Update

| Page | File | Changes Needed |
|------|------|----------------|
| PMS Dashboard | `pms/features/dashboard/pages/pms-dashboard.tsx` | Reduce `p-6` → `p-4 sm:p-6` |
| My Tasks | `pms/features/dashboard/pages/my-tasks.tsx` | Padding responsive |
| Projects List | `pms/features/projects/pages/projects-list.tsx` | Handled by Phase 2 (PageHeader + DataTable) |
| Board | `pms/features/projects/pages/board.tsx` | Horizontal scroll for kanban columns |
| Backlog | `pms/features/projects/pages/backlog.tsx` | Table responsive from Phase 2 |
| Sprints | `pms/features/projects/pages/sprints.tsx` | Table/card responsive |
| Calendar | `pms/features/projects/pages/calendar.tsx` | Horizontal scroll, reduce padding |
| Timeline | `pms/features/projects/pages/timeline.tsx` | Horizontal scroll |
| Overview | `pms/features/projects/pages/overview.tsx` | Grid stacking |
| Goals | `pms/features/goals/pages/goals-list.tsx` | Table responsive from Phase 2 |
| Tags | `pms/features/tags/pages/tag-management.tsx` | Grid responsive |

## Implementation Steps

1. **Dashboard + My Tasks**: `p-6` → `p-4 sm:p-6` padding
2. **Board (Kanban)**: ensure columns container has `overflow-x-auto` and columns have `min-w-[280px]`
3. **Calendar/Timeline**: wrap in `overflow-x-auto` with min-width
4. **Overview**: grid `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
5. **Tag Management**: responsive grid if applicable

## Todo List
- [x] Dashboard padding responsive
- [x] My Tasks padding responsive
- [x] Board kanban horizontal scroll
- [x] Calendar/Timeline overflow handling
- [x] Overview grid stacking
- [x] Verify all PMS pages render on 375px viewport

## Success Criteria
- All PMS pages usable on 375px mobile viewport
- Kanban board horizontally scrollable
- No content overflow or horizontal page scroll
