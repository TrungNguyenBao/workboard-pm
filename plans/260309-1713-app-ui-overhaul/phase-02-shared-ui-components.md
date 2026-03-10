# Phase 2: Shared UI Components

## Context Links
- [Phase 1: Design Foundation](./phase-01-design-foundation.md)
- [Shared UI dir](../../frontend/src/shared/components/ui/)

## Overview
- **Priority**: P1 — building blocks for all pages
- **Status**: pending
- **Effort**: 3h
- **Depends on**: Phase 1
- **Description**: Update all shared UI components to align with enterprise professional direction. Improve button variants, badge colors, data table UX, KPI cards with trends, and empty states.

## Key Insights
- `button.tsx` uses `bg-primary` which auto-resolves after Phase 1. BUT `rounded-sm` should become `rounded-md` for more professional look.
- `badge.tsx` has hardcoded Tailwind color classes (`bg-green-100 text-green-700`) that won't auto-update with token changes. Need semantic mapping.
- `data-table.tsx` lacks alternating row colors and has basic sort indicators.
- `kpi-card.tsx` is minimal — no trend indicators, change percentages, or sparklines.
- `page-header.tsx` works but could use better structure for filter rows.
- `empty-state.tsx` is functional but plain.
- `skeleton-table.tsx` is fine structurally.
- `pagination-controls.tsx` is functional.

## Related Code Files

### Files to Modify
1. `frontend/src/shared/components/ui/button.tsx` — border-radius, add `accent` variant
2. `frontend/src/shared/components/ui/badge.tsx` — update color mappings to new palette
3. `frontend/src/shared/components/ui/data-table.tsx` — alternating rows, better hover, sort indicators
4. `frontend/src/shared/components/ui/kpi-card.tsx` — add trend prop, change indicator, better layout
5. `frontend/src/shared/components/ui/page-header.tsx` — structured filter row area
6. `frontend/src/shared/components/ui/empty-state.tsx` — subtle background pattern, better spacing
7. `frontend/src/shared/components/ui/skeleton-table.tsx` — match new table styling
8. `frontend/src/shared/components/ui/pagination-controls.tsx` — minor style alignment
9. `frontend/src/shared/components/ui/breadcrumb.tsx` — add missing segment labels for new pages
10. `frontend/src/shared/components/ui/input.tsx` — verify focus ring color (should auto-update)

## Implementation Steps

### Step 1: Update button.tsx

Change `rounded-sm` to `rounded-md` in base class. Add `accent` variant:
```ts
accent: 'bg-accent text-white hover:bg-accent-hover',
```
Update focus ring class from `focus-visible:ring-primary` to `focus-visible:ring-ring` (uses CSS var, auto-resolves).

### Step 2: Update badge.tsx — Semantic Color Mapping

Replace hardcoded Tailwind colors with design-token-aware classes:
```ts
variant: {
  default: 'bg-primary/10 text-primary',
  secondary: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  outline: 'border border-border text-muted-foreground',
},
```

### Step 3: Update data-table.tsx — Alternating Rows + Better Sort

Add alternating row tinting and improved sort indicators:
```tsx
// On tbody tr:
className={cn(
  'group border-b border-border transition-colors text-sm',
  'hover:bg-muted/50',
  rowIndex % 2 === 1 && 'bg-muted/20',  // subtle alternating
  onRowClick && 'cursor-pointer',
)}
```

Replace ChevronUp/ChevronDown with ArrowUp/ArrowDown (smaller, cleaner):
```tsx
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
// Show ArrowUpDown when sortable but not sorted (visual affordance)
```

Add `className` prop to DataTable for outer container customization.

### Step 4: Update kpi-card.tsx — Add Trend Indicators

Expand the interface:
```ts
interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number       // e.g., 12.5 for +12.5%
    direction: 'up' | 'down' | 'flat'
  }
  className?: string
  valueClassName?: string
}
```

Add trend display below the value:
```tsx
{trend && (
  <div className={cn(
    'flex items-center gap-1 text-xs mt-1',
    trend.direction === 'up' && 'text-emerald-600',
    trend.direction === 'down' && 'text-red-600',
    trend.direction === 'flat' && 'text-muted-foreground',
  )}>
    {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
    {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
    {trend.direction === 'flat' && <Minus className="h-3 w-3" />}
    <span>{trend.direction === 'flat' ? 'No change' : `${Math.abs(trend.value)}%`}</span>
  </div>
)}
```

Improve icon background to use primary tint: `bg-primary/10 text-primary`.

### Step 5: Update page-header.tsx — Filter Row Structure

Add a `filters` slot for consistent filter/action row layout:
```tsx
interface PageHeaderProps {
  title: string
  description?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onCreateClick?: () => void
  createLabel?: string
  filters?: React.ReactNode      // new: slot for filter dropdowns
  actions?: React.ReactNode       // new: slot for additional action buttons
  children?: React.ReactNode
}
```

Layout: title row on top, filter/search row below with flex-wrap for responsive.

### Step 6: Update empty-state.tsx — Better Styling

Add subtle dotted border pattern and larger icon area:
```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  {icon && (
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
      {icon}
    </div>
  )}
  <p className="text-base font-medium text-foreground">{title}</p>
  {description && (
    <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
  )}
  {action && <div className="mt-5">{action}</div>}
</div>
```

### Step 7: Update skeleton-table.tsx

Match new alternating row pattern — every other skeleton row gets `bg-muted/20`.

### Step 8: Update breadcrumb.tsx

Add missing segment labels for CRM/HRM pages:
```ts
leads: 'Leads',
accounts: 'Accounts',
activities: 'Activities',
campaigns: 'Campaigns',
tickets: 'Tickets',
pipeline: 'Pipeline',
positions: 'Positions',
attendance: 'Attendance',
insurance: 'Insurance',
recruitment: 'Recruitment',
onboarding: 'Onboarding',
performance: 'Performance',
reviews: 'Reviews',
training: 'Training',
offboarding: 'Offboarding',
assets: 'Assets',
procurement: 'Procurement',
backlog: 'Backlog',
sprints: 'Sprints',
```

### Step 9: Verify input.tsx focus ring

Confirm `focus-visible:ring-ring` uses the CSS variable. If it uses `focus-visible:ring-primary` hardcoded, update to `ring` token. Current shadcn input should auto-resolve.

## Todo List
- [ ] Update button.tsx (rounded-md, accent variant, ring token)
- [ ] Update badge.tsx (semantic dark-mode-aware colors)
- [ ] Update data-table.tsx (alternating rows, sort indicators)
- [ ] Update kpi-card.tsx (trend prop, improved icon bg)
- [ ] Update page-header.tsx (filters/actions slots)
- [ ] Update empty-state.tsx (larger icon area, better spacing)
- [ ] Update skeleton-table.tsx (match new table style)
- [ ] Update breadcrumb.tsx (add missing segment labels)
- [ ] Verify input.tsx focus ring color
- [ ] Verify pagination-controls.tsx style consistency
- [ ] Run `npm run build` — no type errors

## Success Criteria
- Badge colors work correctly in both light and dark mode
- Data tables show subtle alternating rows
- KPI cards accept optional trend data
- All existing pages still render without errors (backward compatible)
- No TypeScript errors from interface changes

## Risk Assessment
- **KpiCard interface change**: Adding optional `trend` prop is backward compatible. Existing usages without `trend` continue to work.
- **PageHeader interface change**: Adding optional `filters`/`actions` props is backward compatible.
- **Badge dark mode**: New dark mode classes need visual verification.
