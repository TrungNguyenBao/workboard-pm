# Responsive All Modules

## Overview
Make the entire A-ERP frontend responsive across mobile (< 768px), tablet (768-1023px), and desktop (1024px+). Currently desktop-primary with partial responsive grids. Need mobile sidebar overlay, responsive tables, touch-friendly targets, and consistent breakpoint usage across PMS, CRM, HRM, WMS modules.

## Current State
- Sidebar: collapses to 48px icon-only, but no mobile overlay/drawer behavior
- Header: fixed 48px, no mobile hamburger menu
- Dashboards: `grid-cols-2 lg:grid-cols-4` — partially responsive
- Data tables: full-width `<table>` with no mobile adaptation
- Detail pages: fixed-width layouts, no stacking
- PageHeader: no responsive stacking of title/actions
- Dialogs/drawers: fixed widths (e.g., 480px) that overflow on mobile

## Approach
Desktop-first enhancement. Fix shared shell + components first (Phase 1-2), then sweep modules (Phase 3-6). Minimal changes — only add Tailwind responsive classes, no new dependencies.

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Shell responsive (sidebar + header)](./phase-01-shell-responsive.md) | completed | critical | medium |
| 2 | [Shared UI components](./phase-02-shared-ui-responsive.md) | completed | critical | medium |
| 3 | [PMS module pages](./phase-03-pms-responsive.md) | completed | high | small |
| 4 | [CRM module pages](./phase-04-crm-responsive.md) | completed | high | medium |
| 5 | [HRM module pages](./phase-05-hrm-responsive.md) | completed | high | medium |
| 6 | [WMS module pages](./phase-06-wms-responsive.md) | completed | high | small |

## Key Decisions
- **Breakpoints**: `md` (768px) = tablet, `lg` (1024px) = desktop (Tailwind defaults)
- **Mobile sidebar**: Sheet/overlay from left, auto-close on route change
- **Mobile tables**: Horizontal scroll wrapper (simplest, preserves data density)
- **Touch targets**: Min 44px on interactive elements for mobile
- **No new deps**: Use existing shadcn Sheet component for mobile sidebar

## Dependencies
- Phase 2 depends on Phase 1 (sidebar state hook changes)
- Phases 3-6 independent of each other, depend on Phase 2
