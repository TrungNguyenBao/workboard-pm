# Phase 6: List Pages

## Context Links
- [Phase 2: Shared UI Components](./phase-02-shared-ui-components.md)
- [DataTable component](../../frontend/src/shared/components/ui/data-table.tsx)
- [PageHeader component](../../frontend/src/shared/components/ui/page-header.tsx)

## Overview
- **Priority**: P2 — bulk of user-facing pages
- **Status**: pending
- **Effort**: 4h
- **Depends on**: Phase 2 (updated DataTable, PageHeader, Badge)
- **Description**: Update ~25 list pages across all 4 modules to use the refreshed shared components. Most changes are minimal since list pages compose DataTable + PageHeader. Focus on badge variant alignment, consistent page padding, and removing any hardcoded colors.

## Key Insights
- Most list pages follow an identical pattern: `PageHeader` + `DataTable` + `PaginationControls`
- After Phase 2 updates to shared components, list pages benefit automatically from alternating rows and better sort indicators
- Main manual work per page: verify badge variant usage matches new badge API, fix any hardcoded colors in column definitions
- Known duplication: 3 identical data-table, page-header, pagination components exist in module dirs (wms/hrm/crm). These were identified as tech debt. **Action**: delete duplicates and point imports to shared versions.

## Page Inventory

### PMS (3 list pages)
| Page | File | Notes |
|---|---|---|
| Projects List | `pms/features/projects/pages/list.tsx` | Uses project color dots |
| Goals List | `pms/features/goals/pages/goals-list.tsx` | Has progress bars |
| My Tasks | `pms/features/dashboard/pages/my-tasks.tsx` | Bucket grouping |

### WMS (5 list pages)
| Page | File | Notes |
|---|---|---|
| Products | `wms/features/products/pages/products-list.tsx` | Standard |
| Warehouses | `wms/features/warehouses/pages/warehouses-list.tsx` | Standard |
| Devices | `wms/features/devices/pages/devices-list.tsx` | Status badges |
| Suppliers | `wms/features/suppliers/pages/suppliers-list.tsx` | Standard |
| Inventory | `wms/features/inventory/pages/inventory-list.tsx` | Qty highlighting |

### HRM (12 list pages)
| Page | File | Notes |
|---|---|---|
| Employees | `hrm/features/employees/pages/employees-list.tsx` | Status badges |
| Departments | `hrm/features/departments/pages/departments-list.tsx` | Org chart link |
| Positions | `hrm/features/positions/pages/positions-list.tsx` | Standard |
| Leave Requests | `hrm/features/leave/pages/leave-requests-list.tsx` | Status badges |
| Payroll | `hrm/features/payroll/pages/payroll-list.tsx` | Currency formatting |
| Insurance | `hrm/features/payroll/pages/insurance-list.tsx` | Standard |
| Attendance | `hrm/features/attendance/pages/attendance-list.tsx` | Time formatting |
| Recruitment | `hrm/features/recruitment/pages/recruitment-list.tsx` | Pipeline link |
| Onboarding | `hrm/features/onboarding/pages/onboarding-list.tsx` | Progress badges |
| Performance Reviews | `hrm/features/performance/pages/reviews-list.tsx` | Rating display |
| KPI List | `hrm/features/performance/pages/kpi-list.tsx` | Standard |
| Training | `hrm/features/training/pages/training-list.tsx` | Status badges |
| Offboarding | `hrm/features/offboarding/pages/offboarding-list.tsx` | Status badges |
| Assets | `hrm/features/assets/pages/assets-list.tsx` | Standard |
| Procurement | `hrm/features/procurement/pages/procurement-list.tsx` | Status badges |

### CRM (7 list pages)
| Page | File | Notes |
|---|---|---|
| Contacts | `crm/features/contacts/pages/contacts-list.tsx` | Standard |
| Leads | `crm/features/leads/pages/leads-list.tsx` | Status/source badges |
| Accounts | `crm/features/accounts/pages/accounts-list.tsx` | Standard |
| Deals | `crm/features/deals/pages/deals-list.tsx` | Stage badges, currency |
| Activities | `crm/features/activities/pages/activities-list.tsx` | Type badges |
| Campaigns | `crm/features/campaigns/pages/campaigns-list.tsx` | Status badges |
| Tickets | `crm/features/tickets/pages/tickets-list.tsx` | Priority + status |

## Implementation Steps

### Step 1: Audit for Duplicate Components

Check if any module has local copies of data-table, page-header, or pagination-controls. If found:
1. Verify they're identical to shared versions
2. Update imports in consuming pages to point to `@/shared/components/ui/`
3. Delete the module-local copies

```bash
# Search for duplicate component files
grep -r "export function DataTable" frontend/src/modules/
grep -r "export function PageHeader" frontend/src/modules/
grep -r "export function PaginationControls" frontend/src/modules/
```

### Step 2: Badge Variant Audit

Search all list pages for Badge usage and verify variant names match the updated badge API:

```bash
grep -r "variant=" --include="*-list.tsx" frontend/src/modules/
```

Common mappings to verify:
- `variant="success"` — approved, active, completed states
- `variant="warning"` — pending, in-progress states
- `variant="danger"` — rejected, overdue, cancelled states
- `variant="info"` — new, draft states
- `variant="secondary"` — neutral/default states

### Step 3: Hardcoded Color Audit

Search for hardcoded hex or Tailwind color classes in list pages:
```bash
grep -rn "text-green\|text-red\|text-amber\|text-blue\|bg-green\|bg-red\|bg-amber\|#[0-9A-Fa-f]" --include="*-list.tsx" frontend/src/modules/
```

Replace with badge variants or semantic classes:
- `text-green-600` -> use `<Badge variant="success">`
- `text-red-500` -> use `<Badge variant="danger">`
- Inline status text -> wrap in Badge component

### Step 4: Page Padding Consistency

All list pages should use consistent outer padding. Verify pattern:
```tsx
<div className="flex flex-col h-full">
  <PageHeader ... />
  <DataTable ... />
  <PaginationControls ... />
</div>
```

The `PageHeader` already handles its own padding (`px-6 py-4`). Content area should not add extra horizontal padding since DataTable is full-width.

### Step 5: Batch Update — WMS Pages

WMS pages are simplest (standard CRUD lists). Update all 5:
- Verify imports point to shared components
- Verify badge variants
- Remove any hardcoded colors

### Step 6: Batch Update — HRM Pages

HRM has the most pages (12+). Systematic approach:
1. Open each file
2. Check badge usage
3. Check for hardcoded colors
4. Verify PageHeader usage
5. Fix any issues

### Step 7: Batch Update — CRM Pages

CRM pages may have more complex column definitions (currency, pipeline stages). Verify:
- Deal stage badges use consistent variant mapping
- Currency formatting uses consistent style
- Lead source/status badges match new palette

### Step 8: Batch Update — PMS Pages

PMS list pages (projects, goals, my-tasks) may have custom rendering. Verify:
- Project color dots still work
- Goal progress bars use semantic colors
- My-tasks bucket headers align with new typography

## Todo List
- [ ] Audit and remove duplicate data-table/page-header/pagination components
- [ ] Badge variant audit across all list pages
- [ ] Hardcoded color audit across all list pages
- [ ] Update WMS list pages (5 files)
- [ ] Update HRM list pages (12+ files)
- [ ] Update CRM list pages (7 files)
- [ ] Update PMS list pages (3 files)
- [ ] Verify consistent page padding
- [ ] Visual test: spot-check 2 pages per module in light mode
- [ ] Visual test: spot-check 2 pages per module in dark mode
- [ ] Run `npm run build` — no errors

## Success Criteria
- No duplicate shared components in module dirs
- All badges use the 6 standard variants (default, secondary, success, warning, danger, info, outline)
- No hardcoded color hex values in list page files
- Consistent page structure across all list pages
- All pages render without errors

## Risk Assessment
- **Volume**: ~25 files to touch. Risk of missing some. Mitigated by systematic grep-based audit.
- **Badge variant mismatch**: If a page uses a variant that doesn't exist (e.g., `variant="active"`), TypeScript will catch it at build time.
- **Module-local overrides**: Some pages may have intentional local styling. Preserve those — only standardize badge/color usage.
