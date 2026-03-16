# Phase 1: Shell Responsive (Sidebar + Header)

## Context
- [app-shell.tsx](../../frontend/src/shared/components/shell/app-shell.tsx)
- [sidebar.tsx](../../frontend/src/shared/components/shell/sidebar.tsx)
- [header.tsx](../../frontend/src/shared/components/shell/header.tsx)
- [use-sidebar-state.ts](../../frontend/src/shared/hooks/use-sidebar-state.ts)

## Overview
- **Priority**: Critical
- **Status**: Completed
- **Description**: Add mobile sidebar overlay + hamburger menu in header. On mobile (<lg), sidebar becomes a Sheet overlay instead of inline flex column.

## Key Insights
- Sidebar is currently always rendered inline with `w-56`/`w-12` toggle
- useSidebarState persists to localStorage — need separate `mobileOpen` state (not persisted)
- shadcn Sheet component already exists in the project
- Header has no mobile menu trigger currently

## Requirements

### Functional
- On `< lg` (1024px): sidebar hidden by default, shown as Sheet overlay from left
- Hamburger button in header on mobile only
- Sheet auto-closes on route navigation
- On `>= lg`: current behavior preserved (inline sidebar, no hamburger)

### Non-functional
- No layout shift on breakpoint change
- Smooth transition for Sheet open/close
- Touch-friendly (44px min tap targets on mobile)

## Architecture
```
useSidebarState hook:
  + mobileOpen: boolean
  + setMobileOpen: (open: boolean) => void
  (existing collapsed/toggleCollapsed unchanged)

AppShell:
  <Sidebar /> → desktop only (hidden on mobile via `hidden lg:flex`)
  <MobileSidebar /> → Sheet wrapper, visible only on mobile (`lg:hidden`)

Header:
  + hamburger button (lg:hidden) calling setMobileOpen(true)
```

## Related Code Files
### Modify
- `frontend/src/shared/hooks/use-sidebar-state.ts` — add mobileOpen state
- `frontend/src/shared/components/shell/sidebar.tsx` — extract SidebarContent, add MobileSidebar
- `frontend/src/shared/components/shell/header.tsx` — add hamburger button
- `frontend/src/shared/components/shell/app-shell.tsx` — render both desktop + mobile sidebar

## Implementation Steps

1. **Update `use-sidebar-state.ts`**
   - Add `mobileOpen: boolean` and `setMobileOpen` to store
   - Do NOT persist mobileOpen (transient state, not in persist config)

2. **Refactor `sidebar.tsx`**
   - Extract inner content into `SidebarContent` component (workspace picker, module switcher, nav, footer)
   - Desktop `Sidebar`: wrap SidebarContent in `<aside className="hidden lg:flex ...">`
   - New `MobileSidebar`: wrap SidebarContent in `<Sheet side="left">` with `open={mobileOpen}`
   - MobileSidebar: listen to `useLocation` changes → auto-close

3. **Update `header.tsx`**
   - Add `Menu` icon button before Breadcrumb, visible only `lg:hidden`
   - onClick → `setMobileOpen(true)`

4. **Update `app-shell.tsx`**
   - Render `<MobileSidebar />` alongside `<Sidebar />`

## Todo List
- [x] Add mobileOpen state to useSidebarState
- [x] Extract SidebarContent from Sidebar
- [x] Create MobileSidebar with Sheet overlay
- [x] Add `hidden lg:flex` to desktop Sidebar
- [x] Add hamburger to Header (lg:hidden)
- [x] Auto-close mobile sidebar on route change
- [x] Test: resize between breakpoints, no layout shift
- [x] Test: mobile sidebar opens/closes correctly

## Success Criteria
- Mobile (<1024px): hamburger in header opens sidebar Sheet from left
- Desktop (>=1024px): sidebar inline, no hamburger visible
- Route change closes mobile sidebar
- No regression on desktop layout

## Risk Assessment
- **Sheet component availability**: Already exists in shadcn setup
- **Z-index conflicts**: Sheet has built-in overlay, should be fine
- **SSR/hydration**: N/A (Vite SPA)

## Security Considerations
- None — purely visual changes
