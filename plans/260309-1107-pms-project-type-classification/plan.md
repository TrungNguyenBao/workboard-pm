# PMS Project Type Classification

**Created:** 2026-03-09
**Status:** MERGED → `plans/260309-1047-pms-agile-kanban/`
**Branch:** main

## Overview

Add `project_type` field to projects (`basic` | `kanban` | `agile`). Each type controls which views/features are available.

| View | basic | kanban | agile |
|------|:-----:|:------:|:-----:|
| Overview | ✓ | ✓ | ✓ |
| List | ✓ | ✓ | ✓ |
| Calendar | ✓ | ✓ | ✓ |
| Timeline | ✓ | ✓ | ✓ |
| Board | — | ✓ | ✓ |
| Backlog | — | — | ✓ |
| Sprints | — | — | ✓ |

Default type: `kanban` (preserves existing behavior).

## Phases

| # | Phase | Status | Depends on |
|---|-------|--------|------------|
| 1 | Backend — model + schema + migration | pending | — |
| 2 | Frontend — type selector + conditional views | pending | 1 |

## Related Plans

- `plans/260309-1047-pms-agile-kanban/` — Backlog + Sprint pages (Phase 3/4) referenced by this plan's router additions
