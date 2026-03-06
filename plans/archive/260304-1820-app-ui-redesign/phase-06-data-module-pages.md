---
phase: 6
title: "Data Module Pages (WMS/HRM/CRM)"
status: completed
effort: 4h
depends_on: [2, 3]
---

# Phase 6: Data Module Pages (WMS/HRM/CRM)

## Context Links
- [Shared DataTable](phase-02-shared-components-dry-refactor.md)
- [products-list.tsx](../../frontend/src/modules/wms/features/products/pages/products-list.tsx)
- [employees-list.tsx](../../frontend/src/modules/hrm/features/employees/pages/employees-list.tsx)
- [deals-list.tsx](../../frontend/src/modules/crm/features/deals/pages/deals-list.tsx)

## Overview
Migrate all 11 WMS/HRM/CRM list pages from module-specific data table / page header / pagination to shared components (Phase 2). Delete the 9 duplicate component files. Add skeleton loading + empty states.

## Key Insights
- All list pages follow identical pattern: `PageHeader` + `DataTable` + `Pagination` + `FormDialog`
- Migration is mechanical: change imports, rename component, adjust props
- 5 WMS pages + 4 HRM pages + 2 CRM pages = 11 pages total
- Current pages lack loading states (no `isLoading` check in most)
- Row action buttons use `opacity-0 group-hover:opacity-100` but the `group` class is NOT on the `<tr>` in the shared table -- need to add it

## Requirements

### Functional
- All 11 list pages use shared `DataTable`, `PageHeader`, `PaginationControls`
- Each page shows `SkeletonTable` while data loads
- Each page shows `EmptyState` when no data
- Row actions visible on hover (group-hover pattern works)

### Non-functional
- Zero visual regression (pages look identical after migration)
- All module-specific shared component files deleted
- Each page stays under 120 lines

## Architecture

### Migration Pattern (per page)
```diff
- import { WmsDataTable } from '../../shared/components/wms-data-table'
- import { WmsPageHeader } from '../../shared/components/wms-page-header'
- import { WmsPagination } from '../../shared/components/wms-pagination'
+ import { DataTable } from '@/shared/components/ui/data-table'
+ import { PageHeader } from '@/shared/components/ui/page-header'
+ import { PaginationControls } from '@/shared/components/ui/pagination-controls'
```

Column definitions need conversion from `SimpleColumn` to TanStack `ColumnDef` (or use the `toColumnDef` adapter from Phase 2).

### Pages to Migrate

**WMS (5 pages):**
1. `wms/features/products/pages/products-list.tsx`
2. `wms/features/warehouses/pages/warehouses-list.tsx`
3. `wms/features/devices/pages/devices-list.tsx`
4. `wms/features/inventory/pages/inventory-list.tsx`
5. `wms/features/suppliers/pages/suppliers-list.tsx`

**HRM (4 pages):**
6. `hrm/features/employees/pages/employees-list.tsx`
7. `hrm/features/departments/pages/departments-list.tsx`
8. `hrm/features/leave/pages/leave-requests-list.tsx`
9. `hrm/features/payroll/pages/payroll-list.tsx`

**CRM (2 pages):**
10. `crm/features/contacts/pages/contacts-list.tsx`
11. `crm/features/deals/pages/deals-list.tsx`

## Related Code Files

### Files to MODIFY (all 11 pages above)
Each page: swap imports, convert column defs, add isLoading prop.

### Files to DELETE (after all pages migrated)
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

### Step 1: Migrate first WMS page as template
Start with `products-list.tsx` (most complex -- has category filter):
1. Replace imports
2. Convert `columns` array to use `toColumnDef` adapter
3. Add `isLoading` from hook: `const { data, isLoading } = useProducts(...)`
4. Pass `isLoading` to `DataTable`
5. Verify visual parity

### Step 2: Migrate remaining WMS pages
Apply same pattern to warehouses, devices, inventory, suppliers.
Each page is simpler than products (fewer filters).

### Step 3: Migrate HRM pages
Same pattern. Pages: employees, departments, leave-requests, payroll.
- `employees-list.tsx` -- straightforward, already uses PAGE_SIZE const
- `departments-list.tsx` -- read first, apply pattern
- `leave-requests-list.tsx` -- read first, apply pattern
- `payroll-list.tsx` -- read first, apply pattern

### Step 4: Migrate CRM pages
Same pattern. Pages: contacts, deals.
- `deals-list.tsx` -- has stage filter (same as products category pattern)
- `contacts-list.tsx` -- read first, apply pattern

### Step 5: Verify group-hover for row actions
Ensure `DataTable` renders each `<tr>` with `group` class so action buttons with `group-hover:opacity-100` work correctly.

### Step 6: Delete old module shared components
Delete all 9 files listed above. Verify no remaining imports reference them:
```bash
grep -r "wms-data-table\|wms-page-header\|wms-pagination" frontend/src/
grep -r "hrm-data-table\|hrm-page-header\|hrm-pagination" frontend/src/
grep -r "crm-data-table\|crm-page-header\|crm-pagination" frontend/src/
```

### Step 7: Compile check
Run `tsc --noEmit`.

### Step 8: Delete empty shared/components dirs if empty
If `wms/features/shared/components/`, `hrm/features/shared/components/`, `crm/features/shared/components/` are now empty, delete them.

## Todo List
- [ ] Migrate `products-list.tsx` (WMS) -- template page
- [ ] Migrate `warehouses-list.tsx` (WMS)
- [ ] Migrate `devices-list.tsx` (WMS)
- [ ] Migrate `inventory-list.tsx` (WMS)
- [ ] Migrate `suppliers-list.tsx` (WMS)
- [ ] Migrate `employees-list.tsx` (HRM)
- [ ] Migrate `departments-list.tsx` (HRM)
- [ ] Migrate `leave-requests-list.tsx` (HRM)
- [ ] Migrate `payroll-list.tsx` (HRM)
- [ ] Migrate `contacts-list.tsx` (CRM)
- [ ] Migrate `deals-list.tsx` (CRM)
- [ ] Verify group-hover row actions
- [ ] Delete 9 old module shared components
- [ ] Grep verify no stale imports
- [ ] Compile check
- [ ] Clean up empty directories

## Success Criteria
- All 11 list pages render identically to current state
- Skeleton loading shown during data fetch on every page
- Empty state shown when no data on every page
- 9 duplicate component files deleted
- No stale imports anywhere
- TypeScript compiles without errors

## Risk Assessment
- **Risk:** Column render functions may have module-specific logic
  - **Mitigation:** `toColumnDef` adapter preserves existing render functions exactly
- **Risk:** Some pages may have unique layout quirks
  - **Mitigation:** Read each page file before migrating, note any deviations

## Security Considerations
None -- purely frontend refactoring.
