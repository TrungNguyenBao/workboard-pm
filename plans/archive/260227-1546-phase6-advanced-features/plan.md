---
title: "Phase 6: Advanced Features (Recurring Tasks, Custom Fields, Goals)"
description: "Implement recurring tasks with ARQ jobs, JSONB custom fields, and portfolio goals tracking"
status: COMPLETE
priority: P1
effort: 12d
branch: main
tags: [recurring-tasks, custom-fields, goals, phase-6]
created: 2026-02-27
---

# Phase 6: Advanced Features

## Overview

Three independent feature tracks that extend the core task/project system.
Each track is split into backend + frontend phases for incremental delivery.

## Research Reports

- [Recurring Tasks](../reports/researcher-260227-1543-recurring-tasks-design.md)
- [Custom Fields](../reports/researcher-260227-1544-custom-fields-design.md)

## Phase Plan

| # | Phase | Effort | Status | Depends On |
|---|-------|--------|--------|------------|
| 1 | [Recurring Tasks Backend](phase-01-recurring-tasks-backend.md) | 2d | ✓ complete | - |
| 2 | [Recurring Tasks Frontend](phase-02-recurring-tasks-frontend.md) | 1.5d | ✓ complete | Phase 1 |
| 3 | [Custom Fields Backend](phase-03-custom-fields-backend.md) | 2d | ✓ complete | - |
| 4 | [Custom Fields Frontend](phase-04-custom-fields-frontend.md) | 2d | ✓ complete | Phase 3 |
| 5 | [Goals Backend](phase-05-goals-backend.md) | 2d | ✓ complete | - |
| 6 | [Goals Frontend](phase-06-goals-frontend.md) | 2.5d | ✓ complete | Phase 5 |

## Key Architecture Decisions

1. **Recurring Tasks:** Enum-based recurrence (not RFC 5545) + nightly ARQ cron job
2. **Custom Fields:** JSONB column on tasks + definitions table (not EAV)
3. **Goals:** Separate `goals` table at workspace level with link tables to projects/tasks

## Migrations

- `0004_add_recurring_task_fields.py` -- 5 columns on tasks
- `0005_add_custom_fields.py` -- JSONB column on tasks + custom_field_definitions table
- `0006_add_goals.py` -- goals + goal_project_links + goal_task_links tables

## Parallel Tracks

Phases 1+2, 3+4, and 5+6 are independent tracks. All three backend phases (1, 3, 5) can
be implemented in parallel. Frontend phases depend only on their respective backend phase.

## Dependencies

- Existing: Task model, ARQ worker, RBAC, SSE, TanStack Query hooks
- New packages: `croniter` (pip) for custom CRON validation
- No new frontend packages needed (shadcn components sufficient)
