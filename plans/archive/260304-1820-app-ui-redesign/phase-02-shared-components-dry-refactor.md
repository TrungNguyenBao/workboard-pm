---
phase: 2
title: "Shared Components DRY Refactor"
status: completed
effort: 5h
depends_on: [1]
---

# Phase 2: Shared Components DRY Refactor

## Context Links
- [WMS Data Table](../../frontend/src/modules/wms/features/shared/components/wms-data-table.tsx)
- [HRM Data Table](../../frontend/src/modules/hrm/features/shared/components/hrm-data-table.tsx)
- [CRM Data Table](../../frontend/src/modules/crm/features/shared/components/crm-data-table.tsx)
- [WMS Page Header](../../frontend/src/modules/wms/features/shared/components/wms-page-header.tsx)
- [WMS Pagination](../../frontend/src/modules/wms/features/shared/components/wms-pagination.tsx)

## Overview
Consolidate 9 duplicate components (3 data tables + 3 page headers + 3 paginations) into 3 shared components. Add TanStack Table for sorting/filtering. Add breadcrumb component.

## Key Insights
- All 3 data tables are **byte-for-byte identical** except component name (`WmsDataTable`, `HrmDataTable`, `CrmDataTable`)
- All 3 page headers are **byte-for-byte identical** except component name
- All 3 paginations are **byte-for-byte identical** except component name
- Current data tables have no sorting, no column resize, no bulk selection
- TanStack Table v8 is the standard for headless table logic in React -- pairs well with shadcn
- Existing column interface `{ key, label, render, className }` can map to TanStack column defs

## Requirements

### Functional
- Single `DataTable` component supports: column sorting, row selection (checkbox), empty state, skeleton loading
- Single `PageHeader` component with title, description, search, create button, extra filters slot
- Single `PaginationControls` component with page info + prev/next
- `Breadcrumb` component auto-generated from route path
- All use semantic tokens (dark-mode ready from Phase 1)

### Non-functional
- DataTable stays under 200 lines (split types into separate file if needed)
- Drop-in replacement -- module pages only change import paths
- Column definition API stays backward-compatible with existing `{ key, label, render }` pattern

## Architecture

### DataTable Design
Use `@tanstack/react-table` for headless logic. The component:
1. Accepts `columns` (TanStack `ColumnDef[]`) + `data` + optional config
2. Renders `<table>` with semantic token classes
3. Supports optional features via props: `enableSorting`, `enableSelection`
4. Shows `SkeletonTable` when `isLoading=true`
5. Shows `EmptyState` when `data.length === 0`

**Column def adapter:** Create a helper `simpleColumn()` that maps existing `{ key, label, render }` to TanStack `ColumnDef` so migration is incremental.

### File Structure
```
frontend/src/shared/components/ui/
  data-table.tsx           (~150 lines) -- table rendering
  data-table-types.ts      (~30 lines)  -- shared types/interfaces
  page-header.tsx           (~50 lines)  -- consolidated page header
  pagination-controls.tsx   (~45 lines)  -- consolidated pagination
  breadcrumb.tsx            (~60 lines)  -- route-based breadcrumbs
```

## Related Code Files

### Files to CREATE
- `frontend/src/shared/components/ui/data-table.tsx`
- `frontend/src/shared/components/ui/data-table-types.ts`
- `frontend/src/shared/components/ui/page-header.tsx`
- `frontend/src/shared/components/ui/pagination-controls.tsx`
- `frontend/src/shared/components/ui/breadcrumb.tsx`

### Files to MODIFY (after shared components are ready)
- All 11 module list pages (update imports) -- handled in Phase 6

### Files to DELETE (after Phase 6 migration)
- `frontend/src/modules/wms/features/shared/components/wms-data-table.tsx`
- `frontend/src/modules/wms/features/shared/components/wms-page-header.tsx`
- `frontend/src/modules/wms/features/shared/components/wms-pagination.tsx`
- `frontend/src/modules/hrm/features/shared/components/hrm-data-table.tsx`
- `frontend/src/modules/hrm/features/shared/components/hrm-page-header.tsx`
- `frontend/src/modules/hrm/features/shared/components/hrm-pagination.tsx`
- `frontend/src/modules/crm/features/shared/components/crm-data-table.tsx`
- `frontend/src/modules/crm/features/shared/components/crm-page-header.tsx`
- `frontend/src/modules/crm/features/shared/components/crm-pagination.tsx`

## Implementation Steps

### Step 1: Install TanStack Table
```bash
cd frontend && npm install @tanstack/react-table
```

### Step 2: Create data-table-types.ts
```typescript
// frontend/src/shared/components/ui/data-table-types.ts
import type { ColumnDef } from '@tanstack/react-table'

/** Simple column definition for backward compatibility */
export interface SimpleColumn<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  className?: string
  enableSorting?: boolean
}

/** Convert SimpleColumn to TanStack ColumnDef */
export function toColumnDef<T>(col: SimpleColumn<T>): ColumnDef<T, unknown> {
  return {
    id: col.key,
    header: col.label,
    cell: ({ row }) => col.render(row.original),
    enableSorting: col.enableSorting ?? false,
    meta: { className: col.className },
  }
}
```

### Step 3: Create data-table.tsx
Build `DataTable` component with:
- Props: `columns`, `data`, `keyFn`, `onRowClick?`, `isLoading?`, `emptyMessage?`, `emptyIcon?`, `enableSorting?`, `enableSelection?`
- Uses `useReactTable` with `getCoreRowModel`, optionally `getSortedRowModel`
- Table header cells show sort indicator (chevron up/down) when sortable
- Table rows use `hover:bg-muted transition-colors`
- When `isLoading`, render `SkeletonTable` (from Phase 1)
- When data empty, render `EmptyState` (from Phase 1)
- Checkbox column prepended when `enableSelection=true`
- All colors use semantic tokens

### Step 4: Create page-header.tsx
Consolidate from existing pattern:
```tsx
interface PageHeaderProps {
  title: string
  description?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onCreateClick?: () => void
  createLabel?: string
  children?: React.ReactNode // extra filter controls
}
```
- Same layout as current `WmsPageHeader` but with semantic tokens
- Search is optional (some pages may not need it)
- Create button is optional
- Keep under 50 lines

### Step 5: Create pagination-controls.tsx
Consolidate from existing pattern:
```tsx
interface PaginationControlsProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}
```
- Same logic as current `WmsPagination`
- Semantic tokens
- Keep under 45 lines

### Step 6: Create breadcrumb.tsx
- Uses `useLocation()` from react-router-dom
- Splits pathname into segments, generates breadcrumb items
- Maps known segments to labels (e.g., `pms` -> "Projects", `wms` -> "Warehouse")
- Last segment is not a link (current page)
- Separator: `/` or `ChevronRight` icon
- Uses `text-muted-foreground` for inactive crumbs, `text-foreground` for active

### Step 7: Compile check
Run `cd frontend && npx tsc --noEmit`.

## Todo List
- [ ] Install `@tanstack/react-table`
- [ ] Create `data-table-types.ts`
- [ ] Create `data-table.tsx` with sorting + selection support
- [ ] Create `page-header.tsx`
- [ ] Create `pagination-controls.tsx`
- [ ] Create `breadcrumb.tsx`
- [ ] Compile check
- [ ] Verify shared components render in isolation (import in one test page)

## Success Criteria
- `DataTable` renders identical to current module tables visually
- Sorting works on enabled columns (click header toggles asc/desc/none)
- Selection checkbox column appears when `enableSelection=true`
- `PageHeader`, `PaginationControls` match existing layout exactly
- Breadcrumb renders correct path segments
- All files under 200 lines
- TypeScript compiles without errors

## Risk Assessment
- **Risk:** TanStack Table column defs differ from current `SimpleColumn` interface
  - **Mitigation:** `toColumnDef()` adapter function bridges the gap for easy migration
- **Risk:** DataTable file exceeds 200 lines
  - **Mitigation:** Types extracted to separate file; selection logic can be a hook if needed

## Security Considerations
None -- purely frontend UI components.

## Next Steps
- Phase 6 will migrate all module list pages to use these shared components
- Phase 5 will use `PageHeader` for PMS pages
- Phase 3 will integrate `Breadcrumb` into the shell header
