---
title: "A-ERP Full UI Overhaul"
description: "Comprehensive frontend redesign: design tokens, DRY refactor, shell redesign, dark mode, dashboards"
status: completed
priority: P1
effort: 32h
branch: main
tags: [frontend, ui, design-system, dark-mode, refactor]
created: 2026-03-04
---

# A-ERP Full UI Overhaul

## Problem Statement

Current UI suffers from: hardcoded colors blocking dark mode, 9 duplicate components across WMS/HRM/CRM, no sidebar collapse, no breadcrumbs, no module dashboards, missing skeleton/empty states, and inconsistent layouts.

## Phases

| # | Phase | Effort | Status | Depends On |
|---|-------|--------|--------|------------|
| 1 | [Design System Foundation](phase-01-design-system-foundation.md) | 3h | completed | - |
| 2 | [Shared Components DRY Refactor](phase-02-shared-components-dry-refactor.md) | 5h | completed | Phase 1 |
| 3 | [App Shell Redesign](phase-03-app-shell-redesign.md) | 6h | completed | Phase 1 |
| 4 | [Auth Pages Polish](phase-04-auth-pages-polish.md) | 2h | completed | Phase 1 |
| 5 | [PMS Module UI Refresh](phase-05-pms-module-ui-refresh.md) | 4h | completed | Phase 2, 3 |
| 6 | [Data Module Pages (WMS/HRM/CRM)](phase-06-data-module-pages.md) | 4h | completed | Phase 2, 3 |
| 7 | [Module Dashboards](phase-07-module-dashboards.md) | 5h | completed | Phase 2, 3 |
| 8 | [Polish & Dark Mode QA](phase-08-polish-dark-mode-qa.md) | 3h | completed | All above |

## Dependency Graph

```
Phase 1 (foundation)
  |--- Phase 2 (shared components)
  |--- Phase 3 (app shell)
  |--- Phase 4 (auth polish)
  |
  Phase 2 + 3
    |--- Phase 5 (PMS refresh)
    |--- Phase 6 (data modules)
    |--- Phase 7 (dashboards)
    |
    Phase 5 + 6 + 7
      |--- Phase 8 (QA)
```

Phases 2, 3, 4 can run in parallel after Phase 1.
Phases 5, 6, 7 can run in parallel after Phases 2+3.

## Key Decisions

- **No new deps** -- use existing Recharts (via shadcn Chart), TanStack Table (add as dep), CSS transitions only
- **TanStack Table** is the only new dependency (for data-table consolidation)
- **shadcn/ui Sidebar** component will replace custom sidebar
- **File split rule**: every file must stay under 200 lines
- **Semantic tokens everywhere** -- no hardcoded `bg-white`, `text-neutral-900`, etc.

## Files Affected (Summary)

**Shared components to CREATE:**
- `frontend/src/shared/components/ui/data-table.tsx` (+ types file)
- `frontend/src/shared/components/ui/page-header.tsx`
- `frontend/src/shared/components/ui/pagination-controls.tsx`
- `frontend/src/shared/components/ui/breadcrumb.tsx`
- `frontend/src/shared/components/ui/skeleton-table.tsx`
- `frontend/src/shared/components/ui/empty-state.tsx`
- `frontend/src/shared/components/ui/dark-mode-toggle.tsx`
- `frontend/src/shared/components/ui/kpi-card.tsx`

**Shell files to MODIFY/SPLIT:**
- `frontend/src/shared/components/shell/sidebar.tsx` --> split into 4-5 files
- `frontend/src/shared/components/shell/header.tsx`
- `frontend/src/shared/components/shell/app-shell.tsx`
- `frontend/src/shared/components/shell/module-switcher.tsx`

**Module files to DELETE after migration:**
- 3x `*-data-table.tsx`, 3x `*-page-header.tsx`, 3x `*-pagination.tsx`

**All 11 module list pages** updated to use shared components.
**4 new dashboard pages** created for PMS/WMS/HRM/CRM.
