---
phase: 7
title: "Module Dashboards"
status: completed
effort: 5h
depends_on: [2, 3]
---

# Phase 7: Module Dashboards

## Context Links
- [Router](../../frontend/src/app/router.tsx)
- [Module Store](../../frontend/src/stores/module.store.ts)
- [Design Guidelines - Shadows/Cards](../../docs/design-guidelines.md)

## Overview
Create dashboard pages for all 4 modules (PMS, WMS, HRM, CRM) with KPI cards and charts. Currently WMS/HRM/CRM have no dashboards, and PMS has My Tasks but no stats overview.

## Key Insights
- No charting library is installed; need `recharts` for shadcn Chart compatibility
- Existing routes redirect module root to first list page (e.g., `/wms` -> `/wms/products`)
- Dashboards should be at module root: `/pms/dashboard`, `/wms/dashboard`, etc.
- Design guidelines specify flat cards (border only, no shadow) for metric widgets
- KPI cards should show: metric value, label, trend indicator (up/down arrow + percentage)
- Keep dashboards simple -- real data from existing API endpoints where possible, placeholder counts where not

## Requirements

### Functional
- **PMS Dashboard** (`/pms/dashboard`): task count by status, overdue count, tasks completed this week, project count
- **WMS Dashboard** (`/wms/dashboard`): total products, total warehouses, total inventory items, low-stock count
- **HRM Dashboard** (`/hrm/dashboard`): total employees, departments count, pending leave requests, payroll total
- **CRM Dashboard** (`/crm/dashboard`): total contacts, total deals, pipeline value, deals won count
- Each dashboard: row of KPI cards (top) + 1-2 simple charts (below)
- Charts: bar chart for distribution, line/area chart for trends (if data supports)

### Non-functional
- Each dashboard page under 120 lines
- KPI card as shared component
- Charts use recharts via shadcn Chart pattern
- Skeleton loading for dashboards
- Responsive: 4 KPI cards in row on desktop, 2x2 on tablet, stacked on mobile

## Architecture

### Shared KPI Card Component
```tsx
// frontend/src/shared/components/ui/kpi-card.tsx
interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
}
```
- Flat card style: `border border-border rounded-lg p-4`
- Metric value: `text-2xl font-bold`
- Label: `text-sm text-muted-foreground`
- Trend: small badge with arrow + percentage
- Uses semantic tokens throughout

### Dashboard Data Strategy
Each dashboard uses its module's existing hooks to fetch aggregate data:
- PMS: call `/workspaces/{id}/tasks/my` + `/pms/workspaces/{id}/projects`
- WMS: call existing list endpoints with `page_size=1` to get total counts from response
- HRM: same approach -- list endpoints return `{ items, total }`
- CRM: same approach

For charts, aggregate client-side from list data. No new backend endpoints.

### File Structure
```
frontend/src/shared/components/ui/
  kpi-card.tsx                (~45 lines)

frontend/src/modules/pms/features/dashboard/
  pages/pms-dashboard.tsx     (~110 lines)
  hooks/use-pms-stats.ts      (~40 lines)

frontend/src/modules/wms/features/dashboard/
  pages/wms-dashboard.tsx     (~100 lines)
  hooks/use-wms-stats.ts      (~35 lines)

frontend/src/modules/hrm/features/dashboard/
  pages/hrm-dashboard.tsx     (~100 lines)
  hooks/use-hrm-stats.ts      (~35 lines)

frontend/src/modules/crm/features/dashboard/
  pages/crm-dashboard.tsx     (~100 lines)
  hooks/use-crm-stats.ts      (~35 lines)
```

## Related Code Files

### Files to CREATE
- `frontend/src/shared/components/ui/kpi-card.tsx`
- `frontend/src/modules/pms/features/dashboard/pages/pms-dashboard.tsx`
- `frontend/src/modules/pms/features/dashboard/hooks/use-pms-stats.ts`
- `frontend/src/modules/wms/features/dashboard/pages/wms-dashboard.tsx`
- `frontend/src/modules/wms/features/dashboard/hooks/use-wms-stats.ts`
- `frontend/src/modules/hrm/features/dashboard/pages/hrm-dashboard.tsx`
- `frontend/src/modules/hrm/features/dashboard/hooks/use-hrm-stats.ts`
- `frontend/src/modules/crm/features/dashboard/pages/crm-dashboard.tsx`
- `frontend/src/modules/crm/features/dashboard/hooks/use-crm-stats.ts`

### Files to MODIFY
- `frontend/src/app/router.tsx` -- add dashboard routes, update module root redirects
- `frontend/src/shared/components/shell/sidebar-navigation.tsx` -- add "Dashboard" nav item for each module
- `frontend/src/stores/module.store.ts` -- update module paths to point to dashboards

## Implementation Steps

### Step 1: Install recharts
```bash
cd frontend && npm install recharts
```

### Step 2: Create KPI card component
Create `frontend/src/shared/components/ui/kpi-card.tsx`:
- Flat card with border, no shadow
- Icon (optional) in muted circle on left
- Value + label stacked on right
- Trend badge (optional) below value
- Keep under 45 lines

### Step 3: Create PMS dashboard
Create `use-pms-stats.ts`:
- Fetch my tasks + projects
- Compute: total tasks, overdue, completed this week, project count
- Return `{ stats, isLoading }`

Create `pms-dashboard.tsx`:
- 4 KPI cards: Tasks, Overdue, Completed This Week, Projects
- Simple bar chart: tasks by priority (high/medium/low/none)
- Skeleton state: 4 pulsing card placeholders + chart placeholder

### Step 4: Create WMS dashboard
Create `use-wms-stats.ts`:
- Fetch products (page_size=1 for total), warehouses (page_size=1), inventory
- Return: total products, warehouses, inventory items, low-stock count

Create `wms-dashboard.tsx`:
- 4 KPI cards: Products, Warehouses, Inventory Items, Low Stock
- Bar chart: products by category

### Step 5: Create HRM dashboard
Create `use-hrm-stats.ts`:
- Fetch employees, departments, leave requests, payroll
- Return totals

Create `hrm-dashboard.tsx`:
- 4 KPI cards: Employees, Departments, Pending Leave, Payroll Total
- Bar chart: employees by department

### Step 6: Create CRM dashboard
Create `use-crm-stats.ts`:
- Fetch contacts, deals
- Compute: total contacts, total deals, pipeline value, won deals

Create `crm-dashboard.tsx`:
- 4 KPI cards: Contacts, Deals, Pipeline Value, Deals Won
- Bar chart: deals by stage

### Step 7: Add routes
In `router.tsx`:
```tsx
// Add lazy imports
const PmsDashboard = lazy(() => import('@/modules/pms/features/dashboard/pages/pms-dashboard'))
const WmsDashboard = lazy(() => import('@/modules/wms/features/dashboard/pages/wms-dashboard'))
const HrmDashboard = lazy(() => import('@/modules/hrm/features/dashboard/pages/hrm-dashboard'))
const CrmDashboard = lazy(() => import('@/modules/crm/features/dashboard/pages/crm-dashboard'))

// Add routes
<Route path="/pms/dashboard" element={<PmsDashboard />} />
<Route path="/wms/dashboard" element={<WmsDashboard />} />
<Route path="/hrm/dashboard" element={<HrmDashboard />} />
<Route path="/crm/dashboard" element={<CrmDashboard />} />

// Update module root redirects
<Route path="/wms" element={<Navigate to="/wms/dashboard" replace />} />
<Route path="/hrm" element={<Navigate to="/hrm/dashboard" replace />} />
<Route path="/crm" element={<Navigate to="/crm/dashboard" replace />} />
```

### Step 8: Add Dashboard nav items
In `sidebar-navigation.tsx` (Phase 3), add "Dashboard" as first nav item for each module with `Home` icon.

### Step 9: Update module store paths
In `module.store.ts`, update module paths:
```diff
- { id: 'wms', path: '/wms' },
+ { id: 'wms', path: '/wms/dashboard' },
```

### Step 10: Compile check
Run `tsc --noEmit`.

## Todo List
- [ ] Install `recharts`
- [ ] Create `kpi-card.tsx`
- [ ] Create PMS dashboard + stats hook
- [ ] Create WMS dashboard + stats hook
- [ ] Create HRM dashboard + stats hook
- [ ] Create CRM dashboard + stats hook
- [ ] Add dashboard routes to `router.tsx`
- [ ] Add Dashboard nav items to sidebar
- [ ] Update module store paths
- [ ] Compile check
- [ ] Visual test all 4 dashboards

## Success Criteria
- Each module has a dashboard at `/[module]/dashboard`
- KPI cards show real data from existing APIs
- Charts render with actual data
- Dashboards have skeleton loading states
- All files under 200 lines
- Responsive layout (4 cards row -> 2x2 -> stacked)
- TypeScript compiles without errors

## Risk Assessment
- **Risk:** Some API endpoints may not return total counts efficiently
  - **Mitigation:** Use `page_size=1` requests just to get `total` from response metadata
- **Risk:** recharts bundle size (~200KB gzipped)
  - **Mitigation:** Lazy-loaded dashboard pages -- charts only loaded when navigating to dashboard
- **Risk:** No trend data available (no historical tracking in current backend)
  - **Mitigation:** Omit trend indicators for now, add `trend` prop as optional

## Security Considerations
None -- dashboards display read-only aggregate data from existing authenticated endpoints.

## Next Steps
Future enhancement: backend aggregate endpoints for efficient dashboard queries (avoid multiple list calls).
