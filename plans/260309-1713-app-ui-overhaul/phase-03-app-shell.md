# Phase 3: App Shell

## Context Links
- [Phase 2: Shared UI Components](./phase-02-shared-ui-components.md)
- [Shell dir](../../frontend/src/shared/components/shell/)
- [Sidebar Navigation](../../frontend/src/shared/components/shell/sidebar-navigation.tsx) — 168 lines

## Overview
- **Priority**: P1 — most visible UI surface
- **Status**: completed
- **Effort**: 3h
- **Depends on**: Phase 2
- **Description**: Redesign sidebar with grouped navigation sections, improve header with skip-to-content, refine module switcher and workspace picker styling.

## Key Insights
- `sidebar-navigation.tsx` (168 lines) renders a flat list of nav items per module. HRM has 16+ items — overwhelming without grouping.
- `sidebar.tsx` (41 lines) is the container — uses `bg-muted/50` which will auto-update to slate.
- `header.tsx` (26 lines) is clean. Needs skip-to-content link for accessibility.
- `sidebar-module-switcher.tsx` (67 lines) — active state uses `bg-primary/10 text-primary` which auto-resolves.
- `sidebar-workspace-picker.tsx` — needs reading to assess changes.
- `app-shell.tsx` (85 lines) — may need `id="main-content"` on main element for skip-to-content target.
- **Key constraint**: sidebar-navigation.tsx at 168 lines is near the 200-line limit. Grouping logic may push it over. May need to extract group config into a separate file.

## Related Code Files

### Files to Modify
1. `frontend/src/shared/components/shell/sidebar-navigation.tsx` — grouped sections
2. `frontend/src/shared/components/shell/sidebar.tsx` — subtle styling refinements
3. `frontend/src/shared/components/shell/header.tsx` — skip-to-content link
4. `frontend/src/shared/components/shell/app-shell.tsx` — add main content id
5. `frontend/src/shared/components/shell/sidebar-module-switcher.tsx` — visual refinement
6. `frontend/src/shared/components/shell/sidebar-workspace-picker.tsx` — visual refinement
7. `frontend/src/shared/components/shell/sidebar-user-footer.tsx` — visual refinement

### Files to Create
8. `frontend/src/shared/components/shell/sidebar-nav-config.ts` — extract nav item configs per module with groups

## Implementation Steps

### Step 1: Create sidebar-nav-config.ts — Navigation Group Definitions

Extract all nav item definitions into a config file. Each module has grouped sections:

```ts
export interface NavGroup {
  label: string        // i18n key, e.g., 'nav.group.people'
  items: NavItemDef[]
}

export interface NavItemDef {
  to: string
  icon: string         // Lucide icon name
  labelKey: string     // i18n key
}

export const PMS_NAV: NavGroup[] = [
  {
    label: 'nav.group.overview',
    items: [
      { to: '/pms/dashboard', icon: 'Home', labelKey: 'nav.dashboard' },
      { to: '/pms/my-tasks', icon: 'CheckSquare', labelKey: 'nav.myTasks' },
      { to: '/pms/goals', icon: 'Target', labelKey: 'nav.goals' },
    ],
  },
]

export const HRM_NAV: NavGroup[] = [
  {
    label: 'nav.group.overview',
    items: [
      { to: '/hrm/dashboard', icon: 'Home', labelKey: 'nav.dashboard' },
      { to: '/hrm/employees', icon: 'Users', labelKey: 'nav.employees' },
      { to: '/hrm/departments', icon: 'Briefcase', labelKey: 'nav.departments' },
      { to: '/hrm/positions', icon: 'Box', labelKey: 'nav.positions' },
    ],
  },
  {
    label: 'nav.group.timeOff',
    items: [
      { to: '/hrm/leave', icon: 'Calendar', labelKey: 'nav.leave' },
      { to: '/hrm/attendance', icon: 'Clock', labelKey: 'nav.attendance' },
    ],
  },
  {
    label: 'nav.group.compensation',
    items: [
      { to: '/hrm/payroll', icon: 'DollarSign', labelKey: 'nav.payroll' },
      { to: '/hrm/insurance', icon: 'Shield', labelKey: 'nav.insurance' },
    ],
  },
  {
    label: 'nav.group.talent',
    items: [
      { to: '/hrm/recruitment', icon: 'UserPlus', labelKey: 'nav.recruitment' },
      { to: '/hrm/onboarding', icon: 'ClipboardCheck', labelKey: 'nav.onboarding' },
      { to: '/hrm/training', icon: 'BookOpen', labelKey: 'nav.training' },
      { to: '/hrm/offboarding', icon: 'LogOut', labelKey: 'nav.offboarding' },
    ],
  },
  {
    label: 'nav.group.evaluation',
    items: [
      { to: '/hrm/performance', icon: 'TrendingUp', labelKey: 'nav.performance' },
      { to: '/hrm/reviews', icon: 'Star', labelKey: 'nav.reviews' },
    ],
  },
  {
    label: 'nav.group.resources',
    items: [
      { to: '/hrm/assets', icon: 'Package', labelKey: 'nav.assets' },
      { to: '/hrm/procurement', icon: 'ShoppingCart', labelKey: 'nav.procurement' },
    ],
  },
]

// Similar for WMS_NAV, CRM_NAV
```

This keeps sidebar-navigation.tsx under 200 lines by offloading config.

### Step 2: Refactor sidebar-navigation.tsx — Grouped Rendering

Replace the flat if/else module blocks with a grouped renderer:

```tsx
function NavGroup({ group, collapsed }: { group: NavGroupDef; collapsed: boolean }) {
  return (
    <div>
      {!collapsed && (
        <div className="px-2 pt-4 pb-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t(group.label)}
          </span>
        </div>
      )}
      {group.items.map((item) => (
        <NavItem key={item.to} {...item} collapsed={collapsed} />
      ))}
    </div>
  )
}
```

Render based on `activeModule`:
```tsx
const navGroups = activeModule === 'hrm' ? HRM_NAV
  : activeModule === 'crm' ? CRM_NAV
  : activeModule === 'wms' ? WMS_NAV
  : PMS_NAV

return (
  <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1">
    {navGroups.map((group) => (
      <NavGroup key={group.label} group={group} collapsed={collapsed} />
    ))}
    {/* Common items: Members link */}
    <NavItem to="/members" ... />
    {/* PMS-specific: Projects section + create buttons */}
    {activeModule === 'pms' && <PmsProjectsSection ... />}
  </nav>
)
```

### Step 3: Improve NavItem Active State

Change active state from `bg-primary/10 text-primary` to a more professional left-border indicator:
```tsx
active
  ? 'bg-primary/8 text-primary font-medium border-l-2 border-primary pl-1.5'
  : 'text-muted-foreground hover:bg-muted hover:text-foreground pl-2'
```

### Step 4: Update header.tsx — Skip-to-Content

Add invisible skip link before breadcrumb:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
>
  Skip to content
</a>
```

### Step 5: Update app-shell.tsx — Main Content ID

Add `id="main-content"` to the `<main>` element:
```tsx
<main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
```

### Step 6: Refine sidebar.tsx

Change `bg-muted/50` to `bg-card` for slightly more contrast against page background. The page bg is now `#F8FAFC` (slate-50), sidebar should be white `bg-card` for contrast.

### Step 7: Refine module switcher

Add subtle separator between modules (already has separators in sidebar.tsx). Verify active state uses new blue primary.

## Todo List
- [x] Create sidebar-nav-config.ts with grouped nav definitions
- [x] Add i18n keys for nav groups to en.json and vi.json
- [x] Refactor sidebar-navigation.tsx to use grouped renderer
- [x] Improve NavItem active state with left-border indicator
- [x] Add skip-to-content link in header.tsx
- [x] Add id="main-content" to app-shell.tsx main element
- [x] Refine sidebar.tsx background color
- [ ] Visual test: collapsed sidebar still works
- [ ] Visual test: HRM 16-item nav is now readable with groups
- [ ] Verify all nav links still route correctly

## Success Criteria
- HRM sidebar shows 6 logical groups instead of 16 flat items
- Active nav item has blue left-border indicator
- Skip-to-content link works with Tab key
- Collapsed sidebar still shows tooltips
- No routing regressions

## Risk Assessment
- **sidebar-navigation.tsx size**: Extracting config to separate file keeps it under 200 lines. If still over, extract NavItem and NavGroup components to `sidebar-nav-item.tsx`.
- **i18n keys**: New group labels need translations. Add English and Vietnamese.
- **PMS projects section**: The dynamic project list with create/invite buttons is PMS-specific. Keep as inline section within the grouped renderer, not in config.
