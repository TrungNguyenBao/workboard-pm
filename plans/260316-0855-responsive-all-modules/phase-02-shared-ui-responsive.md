# Phase 2: Shared UI Components Responsive

## Context
- [page-header.tsx](../../frontend/src/shared/components/ui/page-header.tsx)
- [data-table.tsx](../../frontend/src/shared/components/ui/data-table.tsx)
- [kpi-card.tsx](../../frontend/src/shared/components/ui/kpi-card.tsx)
- [pagination-controls.tsx](../../frontend/src/shared/components/ui/pagination-controls.tsx)

## Overview
- **Priority**: Critical
- **Status**: Completed
- **Description**: Make shared UI components responsive. These are used across all modules, so fixing them propagates everywhere.

## Key Insights
- PageHeader: title+actions on same row, overflows on mobile
- DataTable: `<table>` with no horizontal scroll wrapper
- KpiCard: used in all dashboards, already somewhat responsive
- PaginationControls: need to check mobile fit

## Requirements

### Functional
- PageHeader: stack title/actions vertically on mobile, search full-width
- DataTable: horizontal scroll wrapper for overflow, sticky first column optional
- KpiCard: already `grid-cols-2 lg:grid-cols-4` at page level — no changes needed
- Dialogs: max-width responsive (`w-full max-w-lg` pattern)

### Non-functional
- No breaking changes to component APIs
- Minimal class additions

## Related Code Files
### Modify
- `frontend/src/shared/components/ui/page-header.tsx`
- `frontend/src/shared/components/ui/data-table.tsx`
- `frontend/src/shared/components/ui/pagination-controls.tsx`

## Implementation Steps

1. **PageHeader responsive**
   - Title/actions row: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`
   - Search + filters row: search `max-w-xs` → `w-full sm:max-w-xs`
   - Create button: full-width on mobile or keep as-is (small enough)
   - Reduce padding: `px-6` → `px-4 sm:px-6`, `py-4` → `py-3 sm:py-4`

2. **DataTable responsive**
   - Wrap `<table>` in `<div className="overflow-x-auto">`
   - Add `min-w-[600px]` to table to prevent column squishing
   - Reduce cell padding on mobile: `px-4` → `px-3 sm:px-4`

3. **PaginationControls responsive**
   - Check current layout, ensure it wraps on mobile
   - Stack page info and buttons if needed

## Todo List
- [x] PageHeader: responsive stacking
- [x] PageHeader: responsive padding
- [x] DataTable: horizontal scroll wrapper
- [x] DataTable: responsive cell padding
- [x] PaginationControls: check/fix mobile layout
- [x] Verify no API changes to components

## Success Criteria
- PageHeader stacks on mobile, inline on desktop
- DataTable horizontally scrollable on narrow screens
- No component API breaking changes
- All existing pages render correctly

## Risk Assessment
- **Low risk**: Only adding Tailwind responsive classes
- **DataTable min-width**: May need per-page tuning, but 600px is safe default
