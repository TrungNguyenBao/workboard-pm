---
title: "Full App UI/UX Overhaul — Enterprise Professional"
description: "Migrate from purple/DM Sans design to enterprise blue/Inter with data-dense Swiss Modernism 2.0 direction"
status: completed
priority: P1
effort: 20h
branch: kai/feat/ui-overhaul-enterprise
tags: [ui, ux, design-system, frontend, enterprise]
created: 2026-03-09
---

# Full App UI/UX Overhaul — Enterprise Professional

## Summary

Transform A-ERP from its current purple/DM Sans design to an enterprise-grade blue/Inter design system. 7 phases, each independently deployable. Touches ~60 files across design tokens, shared UI, shell, auth, dashboards, list pages, and detail pages.

## Current State

| Aspect | Current | Target |
|---|---|---|
| Primary color | Purple `#5E6AD2` | Trust blue `#2563EB` |
| Font | DM Sans | Inter (variable) |
| Neutral scale | Zinc (cold) | Slate (warmer) |
| KPI cards | Basic (label + value) | Trend indicators, change %, subtle icon bg |
| Data tables | Flat, no row striping | Alternating rows, better sort UX |
| Sidebar nav | Flat list, no grouping | Grouped sections with headers |
| Auth pages | Purple gradient | Navy/blue gradient |
| Focus rings | Purple ring | Blue ring |

## Phases

| # | Phase | Effort | Files | Status |
|---|---|---|---|---|
| 1 | [Design Foundation](./phase-01-design-foundation.md) | 2h | 4 | completed |
| 2 | [Shared UI Components](./phase-02-shared-ui-components.md) | 3h | 10 | completed |
| 3 | [App Shell](./phase-03-app-shell.md) | 3h | 8 | completed |
| 4 | [Auth Pages](./phase-04-auth-pages.md) | 1.5h | 3 | completed |
| 5 | [Dashboard Pages](./phase-05-dashboard-pages.md) | 3h | 5 | completed |
| 6 | [List Pages](./phase-06-list-pages.md) | 4h | ~25 | completed |
| 7 | [Detail & Special Pages](./phase-07-detail-special-pages.md) | 3.5h | ~10 | completed |

## Key Decisions

1. **Inter over IBM Plex Sans** — better ecosystem support, variable font, industry standard
2. **Keep shadcn/ui foundation** — only change tokens and wrapper components, not core primitives
3. **Slate scale over Zinc** — warmer, more professional enterprise feel
4. **Phase 1 is CSS-only** — font + color swap propagates automatically to 80% of components
5. **No new dependencies** — Inter loaded via Google Fonts CDN (same pattern as current DM Sans)

## Dependencies

- Phase 2 depends on Phase 1 (tokens must exist)
- Phase 3 depends on Phase 2 (uses updated components)
- Phases 4-7 depend on Phase 2 (use shared components)
- Phases 4-7 are independent of each other (can parallelize)

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Dark mode regressions | Medium | Test each phase in both modes before merge |
| Badge color conflicts | Low | Phase 2 updates badge variants centrally |
| Hardcoded hex values in charts | Medium | Phase 5 creates chart color constants file |
| Sidebar overflow on grouped nav | Low | Max-height + scroll already in place |
