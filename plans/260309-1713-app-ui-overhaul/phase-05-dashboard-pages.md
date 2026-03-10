# Phase 5: Dashboard Pages

## Context Links
- [Phase 2: Shared UI Components](./phase-02-shared-ui-components.md)
- [PMS Dashboard](../../frontend/src/modules/pms/features/dashboard/pages/pms-dashboard.tsx)
- [WMS Dashboard](../../frontend/src/modules/wms/features/dashboard/pages/wms-dashboard.tsx)
- [HRM Dashboard](../../frontend/src/modules/hrm/features/dashboard/pages/hrm-dashboard.tsx)
- [CRM Dashboard](../../frontend/src/modules/crm/features/dashboard/pages/crm-dashboard.tsx)

## Overview
- **Priority**: P2 — high visibility, showcase of new design
- **Status**: pending
- **Effort**: 3h
- **Depends on**: Phase 2 (KPI card with trends)
- **Description**: Update 4 module dashboard pages to use enhanced KPI cards with trends, fix hardcoded chart colors to use new palette, improve grid layout, and add consistent dashboard page structure.

## Key Insights
- **PMS dashboard** (82 lines): Has hardcoded chart colors `#EF4444`, `#F59E0B`, `#38BDF8`, `#A1A1AA`. Need to align with new palette.
- **CRM dashboard** (146 lines): Most complex. Has `STAGE_COLORS` and `SOURCE_COLORS` maps with hardcoded hex. Near 200-line limit.
- **HRM dashboard**: Needs reading but likely similar pattern.
- **WMS dashboard**: Needs reading but likely similar pattern.
- All dashboards use `KpiCard` without `trend` prop. After Phase 2, they can optionally pass trend data if available from API.
- Chart library is Recharts — colors are passed as props, not CSS variables. Must use hex constants.
- **Opportunity**: Extract shared chart color constants to avoid duplication across dashboards.

## Related Code Files

### Files to Modify
1. `frontend/src/modules/pms/features/dashboard/pages/pms-dashboard.tsx` — chart colors, KPI trends
2. `frontend/src/modules/wms/features/dashboard/pages/wms-dashboard.tsx` — chart colors, KPI trends
3. `frontend/src/modules/hrm/features/dashboard/pages/hrm-dashboard.tsx` — chart colors, KPI trends
4. `frontend/src/modules/crm/features/dashboard/pages/crm-dashboard.tsx` — chart colors, KPI trends
5. `frontend/src/modules/crm/features/dashboard/components/sales-funnel-chart.tsx` — chart colors

### Files to Create
6. `frontend/src/shared/lib/chart-colors.ts` — shared chart color constants

## Implementation Steps

### Step 1: Create shared chart color constants

`frontend/src/shared/lib/chart-colors.ts`:
```ts
/** Shared chart color palette aligned with enterprise design system */
export const CHART_COLORS = {
  // Semantic
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0EA5E9',
  muted: '#94A3B8',

  // Priority
  priorityHigh: '#DC2626',
  priorityMedium: '#D97706',
  priorityLow: '#0EA5E9',
  priorityNone: '#94A3B8',

  // Sequential palette for multi-series charts
  series: [
    '#2563EB',  // blue-600
    '#7C3AED',  // violet-600
    '#D97706',  // amber-600
    '#16A34A',  // green-600
    '#DC2626',  // red-600
    '#0EA5E9',  // sky-500
    '#94A3B8',  // slate-400
    '#DB2777',  // pink-600
  ],
} as const

/** Recharts grid/axis styling */
export const CHART_AXIS_STYLE = {
  fontSize: 12,
  fill: '#64748B',  // slate-500
} as const

export const CHART_GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: '#E2E8F0',  // slate-200
  strokeOpacity: 0.8,
  vertical: false as const,
}
```

### Step 2: Update PMS Dashboard

Replace hardcoded `PRIORITY_COLORS` with imports from `chart-colors.ts`:
```ts
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE } from '@/shared/lib/chart-colors'

const PRIORITY_COLORS: Record<string, string> = {
  high: CHART_COLORS.priorityHigh,
  medium: CHART_COLORS.priorityMedium,
  low: CHART_COLORS.priorityLow,
  none: CHART_COLORS.priorityNone,
}
```

Update chart grid:
```tsx
<CartesianGrid {...CHART_GRID_STYLE} />
<XAxis dataKey="name" tick={CHART_AXIS_STYLE} />
<YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
```

Optionally add trend data to KPI cards if the stats hook provides historical comparison. If not available from API, skip — YAGNI.

### Step 3: Update CRM Dashboard

Replace `STAGE_COLORS` and `SOURCE_COLORS` with new palette-aligned values:
```ts
const STAGE_COLORS: Record<string, string> = {
  Lead: CHART_COLORS.muted,
  Qualified: CHART_COLORS.info,
  'Needs Analysis': CHART_COLORS.primary,
  Proposal: CHART_COLORS.primaryLight,
  Negotiation: CHART_COLORS.warning,
  'Closed Won': CHART_COLORS.success,
  'Closed Lost': CHART_COLORS.danger,
}
```

Use `CHART_COLORS.series` for pie chart colors instead of `SOURCE_COLORS`.

Update all `CartesianGrid`, `XAxis`, `YAxis` to use shared constants.

### Step 4: Update HRM Dashboard

Read file first. Apply same pattern — replace hardcoded colors with chart-colors imports, update axis/grid styling.

### Step 5: Update WMS Dashboard

Read file first. Apply same pattern.

### Step 6: Improve Dashboard Page Structure

All dashboards currently use: `<div className="p-6 space-y-6">`. Keep this — it's consistent and correct.

Improve heading: change from `<h2>` to use PageHeader or just improve styling:
```tsx
<div className="flex items-center justify-between">
  <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
  {/* Future: date range selector, refresh button */}
</div>
```

### Step 7: Update CRM sales-funnel-chart.tsx

Replace any hardcoded colors in the funnel chart component with `CHART_COLORS.series` palette.

## Todo List
- [ ] Create chart-colors.ts shared constants
- [ ] Update PMS dashboard chart colors + grid styling
- [ ] Update CRM dashboard chart colors + grid styling
- [ ] Update CRM sales-funnel-chart.tsx colors
- [ ] Read + update HRM dashboard
- [ ] Read + update WMS dashboard
- [ ] Verify all chart tooltips render correctly
- [ ] Visual test: all 4 dashboards in light mode
- [ ] Visual test: all 4 dashboards in dark mode

## Success Criteria
- No hardcoded chart colors outside `chart-colors.ts`
- All charts use slate-based axis/grid styling
- Priority colors (red/amber/sky/slate) are consistent across PMS and CRM
- Dashboards render without errors
- Chart tooltips still work

## Risk Assessment
- **Recharts color format**: Recharts expects hex strings, not CSS vars. The constants file provides hex directly. No issue.
- **CRM dashboard near 200-line limit**: Currently 146 lines. Replacing color constants with imports may slightly reduce line count. If refactoring pushes over, extract chart sections into sub-components.
- **HRM/WMS dashboards**: Need to read before modifying. May have different chart libraries or patterns. Likely same Recharts setup.
