---
title: "Timeline/Gantt View"
description: "Add timeline view with horizontal Gantt bars, section grouping, drag-to-resize, and today marker"
status: pending
priority: P2
effort: 4h
branch: feat/timeline-gantt-view
tags: [frontend, backend, feature, views]
created: 2026-02-27
---

# Timeline / Gantt View

## Summary

Add a fifth project view ("Timeline") showing tasks as horizontal bars on a scrollable time axis. Tasks span from `start_date` to `due_date`, grouped by section, with drag-to-resize for date changes.

## Architecture Decision

**Custom CSS Grid implementation** -- no external Gantt library.
- `date-fns` already installed for date math
- CSS Grid for time columns (1 column = 1 day)
- Native HTML drag events for bar resize
- Keeps bundle small, full styling control

## Phases

| # | Phase | File | Status | Effort |
|---|-------|------|--------|--------|
| 1 | Backend: add `start_date` to Task model | [phase-01](phase-01-backend-start-date.md) | pending | 30m |
| 2 | Frontend: Timeline/Gantt view UI | [phase-02](phase-02-frontend-gantt-view.md) | pending | 3.5h |

## Key Files Modified

**Backend:**
- `backend/app/models/task.py` -- add `start_date` column
- `backend/app/schemas/task.py` -- add `start_date` to Create/Update/Response
- `backend/alembic/versions/0003_add_task_start_date.py` -- new migration

**Frontend:**
- `frontend/src/features/projects/hooks/use-project-tasks.ts` -- add `start_date` to Task type + `useUpdateTask` hook
- `frontend/src/features/projects/pages/timeline.tsx` -- main page (imports components)
- `frontend/src/features/projects/components/timeline-grid.tsx` -- grid + time axis
- `frontend/src/features/projects/components/timeline-task-bar.tsx` -- draggable bar
- `frontend/src/features/projects/components/project-header.tsx` -- add Timeline tab
- `frontend/src/app/router.tsx` -- add `/projects/:projectId/timeline` route

## Dependencies

- `date-fns` (already installed)
- `@dnd-kit` (already installed, but NOT used here -- native drag simpler for resize)
- shadcn/ui Tooltip for bar hover info

## Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tasks without start_date | No bar rendered | Show as dot on due_date, or hide with "unscheduled" section |
| Large project (100+ tasks) | Scroll perf | Virtual rows only if needed; CSS Grid handles columns fine |
| Date validation (start > due) | Bad data | Frontend prevents; backend validates in schema |
