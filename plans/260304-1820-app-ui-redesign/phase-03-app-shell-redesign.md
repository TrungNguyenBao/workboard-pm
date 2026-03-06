---
phase: 3
title: "App Shell Redesign"
status: completed
effort: 6h
depends_on: [1]
---

# Phase 3: App Shell Redesign

## Context Links
- [Current sidebar.tsx (421 lines)](../../frontend/src/shared/components/shell/sidebar.tsx)
- [Current header.tsx](../../frontend/src/shared/components/shell/header.tsx)
- [Current app-shell.tsx](../../frontend/src/shared/components/shell/app-shell.tsx)
- [Current module-switcher.tsx](../../frontend/src/shared/components/shell/module-switcher.tsx)
- [Design Guidelines - Layout](../../docs/design-guidelines.md)

## Overview
Redesign the app shell: split bloated sidebar into multiple files, add collapse-to-icons mode, move module switcher into sidebar, add breadcrumbs to header, fix semantic tokens throughout.

## Key Insights
- `sidebar.tsx` is **421 lines** (2x the 200-line limit) -- contains Sidebar, ProjectNavItem, NavItem
- Module switcher lives in a separate header strip (`app-shell.tsx` lines 76-78), disconnected from sidebar nav
- Design guidelines specify: sidebar expanded=240px, collapsed=48px
- No breadcrumbs exist anywhere in the app
- `header.tsx` is only 32 lines -- very thin, can absorb breadcrumbs easily
- Workspace picker popup is a custom implementation (lines 88-165) -- can be extracted

## Requirements

### Functional
- Sidebar collapses to icon-only (48px) mode with toggle button
- Collapsed state persists in localStorage
- Module switcher moves to top of sidebar (below workspace picker)
- Header shows breadcrumbs (left side) + search/notifications/dark-mode-toggle (right side)
- Module-specific header with page title is removed -- breadcrumbs replace it
- Sidebar smooth transition on collapse/expand (CSS transition on width)

### Non-functional
- Every shell file stays under 200 lines
- Sidebar collapse animation: `transition-[width] 200ms ease`
- No layout shift in main content area during collapse (use CSS `flex`)

## Architecture

### New Sidebar File Structure
```
frontend/src/shared/components/shell/
  sidebar.tsx                  (~80 lines)  -- main layout + collapse toggle
  sidebar-workspace-picker.tsx (~90 lines)  -- workspace dropdown
  sidebar-module-switcher.tsx  (~60 lines)  -- module tabs (moved from header)
  sidebar-navigation.tsx       (~100 lines) -- nav items for active module
  sidebar-project-nav-item.tsx (~95 lines)  -- PMS project item with rename/delete
  sidebar-user-footer.tsx      (~60 lines)  -- user avatar, settings, logout
  header.tsx                   (~55 lines)  -- breadcrumbs + actions
  app-shell.tsx                (~85 lines)  -- layout orchestrator (unchanged logic)
```

### Collapse Behavior
- Collapsed state stored in Zustand `useLayoutStore` (or localStorage via hook)
- When collapsed:
  - Sidebar width: 48px
  - Only icons shown (nav items, module icons, workspace initial)
  - Workspace picker shows single letter avatar
  - Module switcher shows icons only
  - User footer shows avatar only
  - Tooltip on hover for icon-only items
- Toggle button: `PanelLeftClose` / `PanelLeftOpen` icon at bottom of sidebar

### Header with Breadcrumbs
- Left side: `<Breadcrumb />` component (from Phase 2)
- Right side: search button + dark mode toggle (from Phase 1) + notification bell
- Remove separate `<Header>` component from individual pages (my-tasks, etc.)
- Individual pages no longer import `<Header>` -- breadcrumbs handle page identity

### Module Switcher in Sidebar
- Move module switcher from `app-shell.tsx` header strip into sidebar
- Position: below workspace picker, above navigation
- When collapsed: show only icons (no labels)
- Active module highlighted with `bg-primary/10 text-primary`
- Separator line between module switcher and navigation

## Related Code Files

### Files to CREATE
- `frontend/src/shared/components/shell/sidebar-workspace-picker.tsx`
- `frontend/src/shared/components/shell/sidebar-module-switcher.tsx`
- `frontend/src/shared/components/shell/sidebar-navigation.tsx`
- `frontend/src/shared/components/shell/sidebar-project-nav-item.tsx`
- `frontend/src/shared/components/shell/sidebar-user-footer.tsx`
- `frontend/src/shared/hooks/use-sidebar-state.ts` (~25 lines)

### Files to MODIFY
- `frontend/src/shared/components/shell/sidebar.tsx` -- rewrite as orchestrator
- `frontend/src/shared/components/shell/header.tsx` -- add breadcrumbs, dark mode toggle
- `frontend/src/shared/components/shell/app-shell.tsx` -- remove module switcher strip, pass collapsed state
- `frontend/src/modules/pms/features/dashboard/pages/my-tasks.tsx` -- remove `<Header>` import
- `frontend/src/modules/pms/features/projects/components/project-header.tsx` -- remove search/bell (now in shell header)

### Files to DELETE
- `frontend/src/shared/components/shell/module-switcher.tsx` -- replaced by `sidebar-module-switcher.tsx`

## Implementation Steps

### Step 1: Create sidebar state hook
Create `frontend/src/shared/hooks/use-sidebar-state.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean
  toggleCollapsed: () => void
}

export const useSidebarState = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: 'a-erp-sidebar' },
  ),
)
```

### Step 2: Extract sidebar-workspace-picker.tsx
Extract lines 73-166 from current `sidebar.tsx`:
- The workspace switcher button, dropdown, rename inline editor
- Props: `collapsed: boolean` (show abbreviated UI when collapsed)
- When collapsed: show only the workspace initial letter avatar, no name
- Include all existing workspace switching logic, rename mutation

### Step 3: Create sidebar-module-switcher.tsx
Adapt `module-switcher.tsx` for sidebar context:
- Vertical layout instead of horizontal (sidebar is vertical)
- When collapsed: icons only with tooltip
- When expanded: icon + label
- Active state: `bg-primary/10 text-primary`

### Step 4: Extract sidebar-navigation.tsx
Extract lines 169-242 from current `sidebar.tsx`:
- Module-specific nav items (PMS/WMS/HRM/CRM conditional rendering)
- Props: `collapsed: boolean`
- When collapsed: icons only with tooltip
- Extract `NavItem` sub-component or inline it

### Step 5: Extract sidebar-project-nav-item.tsx
Extract `ProjectNavItem` function (lines 303-396 from current `sidebar.tsx`):
- Self-contained component with rename/delete/settings
- Props: project, active, workspaceId, collapsed
- When collapsed: show color dot only with tooltip

### Step 6: Extract sidebar-user-footer.tsx
Extract lines 250-277:
- User avatar, settings button, logout button, language switcher
- Props: `collapsed: boolean`
- When collapsed: show avatar only, settings/logout as tooltip menu

### Step 7: Rewrite sidebar.tsx as orchestrator
New `sidebar.tsx` (~80 lines):
```tsx
export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebarState()

  return (
    <aside className={cn(
      'flex h-screen flex-col border-r border-border bg-muted transition-[width] duration-200',
      collapsed ? 'w-12' : 'w-56',
    )}>
      <SidebarWorkspacePicker collapsed={collapsed} />
      <SidebarModuleSwitcher collapsed={collapsed} />
      <Separator />
      <SidebarNavigation collapsed={collapsed} />
      <SidebarUserFooter collapsed={collapsed} />
      <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
    </aside>
  )
}
```

### Step 8: Update header.tsx with breadcrumbs
```tsx
export function Header() {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <Breadcrumb />
      <div className="flex items-center gap-2">
        <SearchButton />
        <DarkModeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
```
- Remove `title` and `actions` props (no longer needed)
- Breadcrumb auto-generates from route

### Step 9: Update app-shell.tsx
- Remove the module switcher strip (lines 76-78)
- Header is now always shown at top of content area
- Pass no props to Header (it self-manages breadcrumbs)
```tsx
<div className="flex h-screen overflow-hidden bg-background">
  <Sidebar />
  <div className="flex flex-1 flex-col overflow-hidden">
    <Header />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
</div>
```

### Step 10: Remove Header imports from pages
- `my-tasks.tsx`: remove `<Header title={...} />`, content flows directly
- `project-header.tsx`: keep as project sub-header (view tabs), but remove search/bell
  (these are now in shell header)

### Step 11: Delete old module-switcher.tsx
Remove `frontend/src/shared/components/shell/module-switcher.tsx`.

### Step 12: Compile check + visual test
Run `tsc --noEmit` and visually verify:
- Sidebar expands/collapses smoothly
- Module switcher works in sidebar
- Breadcrumbs show correct path
- Header shows search + dark mode + notifications

## Todo List
- [ ] Create `use-sidebar-state.ts`
- [ ] Create `sidebar-workspace-picker.tsx`
- [ ] Create `sidebar-module-switcher.tsx`
- [ ] Create `sidebar-navigation.tsx`
- [ ] Create `sidebar-project-nav-item.tsx`
- [ ] Create `sidebar-user-footer.tsx`
- [ ] Rewrite `sidebar.tsx` as orchestrator
- [ ] Update `header.tsx` with breadcrumbs + dark mode toggle
- [ ] Update `app-shell.tsx` to remove module switcher strip
- [ ] Remove `<Header>` imports from individual pages
- [ ] Delete old `module-switcher.tsx`
- [ ] Compile check
- [ ] Visual test: sidebar collapse/expand
- [ ] Visual test: breadcrumbs across routes

## Success Criteria
- Sidebar toggles between 240px and 48px with smooth animation
- Collapse state persists across page refresh
- Module switcher in sidebar -- works expanded and collapsed
- Breadcrumbs show in header for all routes
- Every shell file under 200 lines
- No import errors or type errors

## Risk Assessment
- **Risk:** Pages that import `<Header>` directly will break
  - **Mitigation:** Step 10 explicitly lists and updates all affected imports
- **Risk:** Sidebar collapse may cause content reflow flicker
  - **Mitigation:** Use `transition-[width]` on sidebar + `flex-1` on content area
- **Risk:** Tooltip library needed for collapsed icon labels
  - **Mitigation:** Already have `@radix-ui/react-tooltip` in deps + shadcn Tooltip component

## Security Considerations
None -- purely frontend layout changes.
