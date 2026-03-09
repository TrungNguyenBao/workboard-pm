---
title: "PMS Agile/Kanban + Project Type Classification"
description: "Project type (basic/kanban/agile) classification, sprints, story points, WIP limits, backlog, and analytics"
status: completed
priority: P1
effort: 16h
branch: feat/pms-agile-kanban
tags: [pms, agile, kanban, sprints, project-type, analytics]
created: 2026-03-09
merged: 260309-1107-pms-project-type-classification
completed: 2026-03-09
---

# PMS Agile/Kanban + Project Type Classification

## Summary

Two plans merged into one:
1. **Project type classification** (`basic` | `kanban` | `agile`) — controls which views are visible per project
2. **Agile/Kanban features** — sprints, story points, task types, WIP limits, backlog, and analytics

| View | basic | kanban | agile |
|------|:-----:|:------:|:-----:|
| Overview / List / Calendar / Timeline | ✓ | ✓ | ✓ |
| Board | — | ✓ | ✓ |
| Backlog | — | — | ✓ |
| Sprints | — | — | ✓ |

Default project type: `kanban` — preserves all existing behavior.

## Parallel Execution Strategy

```
Phase 1 (DB + Migration)  -->  Phase 2 (Backend API)  -->  Phase 3 (Frontend: Type + Sprint UI)
                                                       |    Phase 4 (Analytics) [parallel with 3]
                                                       +-->  Phase 5 (Tests) [after 3+4]
```

## Phases

| # | Phase | Status | Effort | Depends On | Files |
|---|-------|--------|--------|------------|-------|
| 1 | [DB Models + Migration](./phase-01-db-models-migration.md) | completed | 2h | -- | 4 modify, 2 create |
| 2 | [Backend API](./phase-02-backend-api.md) | completed | 4h | Phase 1 | 2 modify, 4 create |
| 3 | [Frontend: Project Type + Sprint UI](./phase-03-frontend-sprint-ui.md) | completed | 5h | Phase 2 | 7 modify, 7 create |
| 4 | [Analytics](./phase-04-analytics.md) | completed | 2.5h | Phase 2 | 2 modify, 3 create |
| 5 | [Tests](./phase-05-tests.md) | completed | 1.5h | Phases 3+4 | 0 modify, 3 create |

## Key Dependencies

- recharts v2.15.4 already in frontend/package.json
- @dnd-kit already installed for drag-drop
- TanStack Query v5 for all server state
- shadcn/ui components available (Sheet, Select, Badge, Button, Dialog, etc.)
- Alembic migration chain: latest is `0017_crm_sop_workflow_fields`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration conflicts with other branches | Medium | Single migration 0018 covers all new columns |
| Board.tsx complexity increase | Medium | Extract sprint selector into own component, keep board.tsx under 200 lines |
| Task schema backward compatibility | Low | All new fields nullable, no breaking changes to existing API |
| Existing projects default to kanban | Low | server_default='kanban' on project_type column |
| Burndown chart accuracy | Low | Compute from completed_at timestamps, not real-time snapshots |
