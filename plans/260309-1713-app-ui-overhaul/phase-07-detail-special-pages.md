# Phase 7: Detail & Special Pages

## Context Links
- [Phase 2: Shared UI Components](./phase-02-shared-ui-components.md)
- [Phase 5: Dashboard Pages](./phase-05-dashboard-pages.md)

## Overview
- **Priority**: P3 — complex pages, lower frequency of use
- **Status**: pending
- **Effort**: 3.5h
- **Depends on**: Phase 2
- **Description**: Update detail views, board/kanban views, timeline, pipeline, and other special pages to align with the enterprise design system. These pages have custom layouts beyond the standard list pattern.

## Key Insights
- Detail pages (employee-detail, account-detail, recruitment-detail, offboarding-detail) have custom tab/section layouts
- Board view (`board.tsx`) uses kanban columns with drag-and-drop — card styling needs attention
- Timeline view (`timeline.tsx`) has custom timeline grid rendering
- Pipeline view (`deals-pipeline.tsx`) is CRM's kanban-style deal board
- Sprint pages (`sprints.tsx`, `backlog.tsx`) have custom sprint management UI
- Project overview (`overview.tsx`) has project stats/activity
- Calendar view (`calendar.tsx`) has date-based layout
- These pages likely have more hardcoded colors than list pages due to custom rendering

## Page Inventory

### Detail Pages
| Page | File | Complexity |
|---|---|---|
| Employee Detail | `hrm/features/employees/pages/employee-detail.tsx` | High — tabs, contracts, salary |
| Account Detail | `crm/features/accounts/pages/account-detail.tsx` | Medium — info + activity |
| Recruitment Detail | `hrm/features/recruitment/pages/recruitment-detail.tsx` | High — pipeline board |
| Offboarding Detail | `hrm/features/offboarding/pages/offboarding-detail.tsx` | Medium — checklist |

### Board/Kanban Pages
| Page | File | Complexity |
|---|---|---|
| Task Board | `pms/features/projects/pages/board.tsx` | High — DnD columns |
| Deals Pipeline | `crm/features/deals/pages/deals-pipeline.tsx` | High — DnD pipeline |
| Candidate Pipeline | `hrm/features/recruitment/components/candidate-pipeline-board.tsx` | High — DnD |

### Special Pages
| Page | File | Complexity |
|---|---|---|
| Timeline | `pms/features/projects/pages/timeline.tsx` | High — custom grid |
| Calendar | `pms/features/projects/pages/calendar.tsx` | Medium |
| Sprints | `pms/features/projects/pages/sprints.tsx` | Medium |
| Backlog | `pms/features/projects/pages/backlog.tsx` | Medium |
| Project Overview | `pms/features/projects/pages/overview.tsx` | Medium — stats |

### Key Components (supporting above pages)
| Component | File |
|---|---|
| Board Kanban Column | `pms/features/projects/components/board-kanban-column.tsx` |
| Board Task Card | `pms/features/projects/components/board-task-card.tsx` |
| Timeline Grid | `pms/features/projects/components/timeline-grid.tsx` |
| Timeline Task Bar | `pms/features/projects/components/timeline-task-bar.tsx` |
| Deal Card | `crm/features/deals/components/deal-card.tsx` |
| Sprint Analytics | `pms/features/projects/components/sprint-analytics-panel.tsx` |
| Burndown Chart | `pms/features/projects/components/burndown-chart.tsx` |
| Velocity Chart | `pms/features/projects/components/velocity-chart.tsx` |
| Project Header | `pms/features/projects/components/project-header.tsx` |

## Implementation Steps

### Step 1: Board/Kanban Card Styling

Update `board-task-card.tsx`:
- Card border: use `border-border` (auto-resolves to slate-200)
- Card shadow: `shadow-card` (already defined in tailwind config)
- Drag ghost: `shadow-drag` + `rotate(2deg)` (already defined)
- Priority left-border color: use chart-colors constants or semantic classes
- Badge variants: align with Phase 2 badge API

Update `board-kanban-column.tsx`:
- Column header: ensure uses `text-muted-foreground` for count badge
- Column background: `bg-muted/30` for subtle contrast

### Step 2: Deal Card + Pipeline Styling

Update `deal-card.tsx`:
- Stage color indicator: map to `CHART_COLORS` from `chart-colors.ts`
- Currency display: consistent formatting
- Card hover: `hover:border-primary/30` for subtle blue highlight

Update `deals-pipeline.tsx`:
- Column headers with stage colors from chart-colors
- Drop zone visual feedback

### Step 3: Timeline View

Update `timeline-grid.tsx` and `timeline-task-bar.tsx`:
- Grid lines: use `border-border` (slate-200)
- Today marker: use `bg-primary` (blue) instead of any purple
- Task bars: use project color or `bg-primary` for default
- Date headers: `text-muted-foreground`

### Step 4: Detail Page Tab Styling

For employee-detail, account-detail, recruitment-detail:
- Tab active indicator: blue underline (uses primary token)
- Section headers: `text-lg font-semibold` consistent typography
- Info grid labels: `text-sm text-muted-foreground`
- Info grid values: `text-sm text-foreground`
- Status badges: use Phase 2 badge variants

### Step 5: Sprint/Backlog Pages

Update sprints.tsx and backlog.tsx:
- Sprint status badges: align with new badge variants
- Sprint progress bars: use `bg-primary` for fill
- Backlog item styling: consistent with task cards

### Step 6: Chart Components

Update burndown-chart.tsx, velocity-chart.tsx, sprint-analytics-panel.tsx:
- Import colors from `chart-colors.ts`
- Use `CHART_AXIS_STYLE` and `CHART_GRID_STYLE`
- Replace any hardcoded hex values

### Step 7: Project Header + Overview

Update project-header.tsx:
- Project color dot: keep as-is (user-defined colors)
- View switcher tabs: active tab uses primary blue
- Settings button: ghost variant

Update overview.tsx:
- Stats cards: use KpiCard component
- Activity timeline: use muted-foreground for timestamps

### Step 8: Candidate Pipeline Board

Update candidate-pipeline-board.tsx, candidate-pipeline-column.tsx, candidate-pipeline-card.tsx:
- Same treatment as task board — consistent card/column styling
- Stage colors aligned with recruitment status semantics

### Step 9: Calendar View

Update calendar.tsx:
- Today highlight: `bg-primary/10` with `text-primary` for date number
- Event dots: use semantic colors for task priorities
- Grid borders: `border-border`

## Todo List
- [ ] Update board-task-card.tsx (card styling, priority border)
- [ ] Update board-kanban-column.tsx (column styling)
- [ ] Update deal-card.tsx (stage colors, hover)
- [ ] Update deals-pipeline.tsx (column headers)
- [ ] Update timeline-grid.tsx (grid lines, today marker)
- [ ] Update timeline-task-bar.tsx (bar colors)
- [ ] Update employee-detail.tsx (tab styling, badges)
- [ ] Update account-detail.tsx (tab styling, badges)
- [ ] Update recruitment-detail.tsx (pipeline reference)
- [ ] Update offboarding-detail.tsx (checklist styling)
- [ ] Update sprints.tsx (status badges, progress)
- [ ] Update backlog.tsx (item styling)
- [ ] Update burndown-chart.tsx (chart colors)
- [ ] Update velocity-chart.tsx (chart colors)
- [ ] Update sprint-analytics-panel.tsx (chart colors)
- [ ] Update project-header.tsx (view switcher)
- [ ] Update overview.tsx (stats cards)
- [ ] Update candidate-pipeline-board/column/card.tsx
- [ ] Update calendar.tsx (today highlight)
- [ ] Visual test: board view with cards
- [ ] Visual test: timeline with tasks
- [ ] Visual test: CRM pipeline
- [ ] Visual test: employee detail tabs

## Success Criteria
- All kanban/board cards use consistent border and shadow styling
- Timeline today marker is blue, not purple
- Chart colors reference shared chart-colors.ts
- Detail page tabs use blue active indicator
- All badge variants match Phase 2 definitions
- No hardcoded purple hex values anywhere
- Drag-and-drop still functions correctly (styling only, no logic changes)

## Risk Assessment
- **Drag-and-drop regression**: Only changing CSS classes, not DnD logic. Low risk but test manually.
- **Timeline custom rendering**: timeline-grid.tsx may use canvas or custom SVG. Need to read file before modifying — may require different approach than class-based updates.
- **File count**: ~19 files to touch. Systematic approach with grep audits mitigates missed files.
- **Component interdependencies**: board-task-card is used by board.tsx AND possibly sprint views. Changes propagate to all consumers — verify all usage points.

## Security Considerations
- No security impact. Visual-only changes.

## Next Steps
- After Phase 7, conduct full visual regression test across all modules
- Update design-guidelines.md with any new patterns discovered
- Consider: snapshot tests or Chromatic visual regression for future changes
