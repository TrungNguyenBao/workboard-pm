---
phase: 5
title: "PMS Module UI Refresh"
status: completed
effort: 4h
depends_on: [2, 3]
---

# Phase 5: PMS Module UI Refresh

## Context Links
- [my-tasks.tsx](../../frontend/src/modules/pms/features/dashboard/pages/my-tasks.tsx)
- [board.tsx](../../frontend/src/modules/pms/features/projects/pages/board.tsx)
- [project-header.tsx](../../frontend/src/modules/pms/features/projects/components/project-header.tsx)
- [goals-list.tsx](../../frontend/src/modules/pms/features/goals/pages/goals-list.tsx)
- [overview.tsx](../../frontend/src/modules/pms/features/projects/pages/overview.tsx)

## Overview
Polish PMS module pages: add skeleton loading, proper empty states, fix semantic tokens, improve project header now that breadcrumbs exist in shell header. Remove redundant Header imports.

## Key Insights
- `my-tasks.tsx` (222 lines) -- slightly over limit, has inline `BucketSection` + `TaskRow` sub-components
- `my-tasks.tsx` uses `<Header>` import -- remove since shell header now has breadcrumbs (Phase 3)
- Loading state is plain text "Loading..." -- replace with skeleton
- Empty state uses inline icon + text -- replace with shared `EmptyState` component
- `project-header.tsx` has its own search + notification bell -- redundant with shell header
- `goals-list.tsx` has inline `EmptyState` function (lines 107-116) -- replace with shared component
- Board page is well-structured at 161 lines -- minimal changes needed

## Requirements

### Functional
- My Tasks page: skeleton loading (pulsing task rows), proper empty state
- Goals page: use shared `EmptyState`, add skeleton grid
- Project header: remove search/bell (now in shell), keep view tabs
- Overview page: add skeleton for loading state

### Non-functional
- `my-tasks.tsx` must be split to stay under 200 lines
- All pages use semantic tokens only
- Shared components from Phase 2 used where applicable

## Architecture

### My Tasks Page Split
```
frontend/src/modules/pms/features/dashboard/
  pages/my-tasks.tsx              (~90 lines) -- page layout + data fetching
  components/my-tasks-bucket.tsx  (~50 lines) -- bucket section header + task list
  components/my-tasks-row.tsx     (~65 lines) -- individual task row with complete toggle
```

### Project Header Simplification
Remove: search button, notification bell, command palette
Keep: project name, color dot, view tabs (board/list/calendar/overview/timeline)
Result: ~50 lines (down from 81)

## Related Code Files

### Files to MODIFY
- `frontend/src/modules/pms/features/dashboard/pages/my-tasks.tsx` -- split + skeleton + empty state
- `frontend/src/modules/pms/features/projects/components/project-header.tsx` -- simplify
- `frontend/src/modules/pms/features/goals/pages/goals-list.tsx` -- use shared EmptyState
- `frontend/src/modules/pms/features/projects/pages/overview.tsx` -- add skeleton
- `frontend/src/modules/pms/features/projects/pages/board.tsx` -- semantic token sweep

### Files to CREATE
- `frontend/src/modules/pms/features/dashboard/components/my-tasks-bucket.tsx`
- `frontend/src/modules/pms/features/dashboard/components/my-tasks-row.tsx`

## Implementation Steps

### Step 1: Split my-tasks.tsx
Extract `TaskRow` component into `my-tasks-row.tsx`:
- Move `TaskRow` function (lines 58-132) into its own file
- Props: `task`, `workspaceId`, `projectName`, `onOpen`
- Sweep hardcoded colors: `hover:bg-neutral-50` -> `hover:bg-muted`

Extract `BucketSection` component into `my-tasks-bucket.tsx`:
- Move `BucketSection` function (lines 134-179) into its own file
- Import `MyTasksRow` from sibling
- Accent colors: add dark mode variants (`bg-red-50 dark:bg-red-950/30`)

### Step 2: Update my-tasks.tsx page
- Remove `<Header>` import and usage
- Replace loading text with skeleton:
  ```tsx
  {isLoading && (
    <div className="space-y-2 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-muted animate-pulse rounded" />
      ))}
    </div>
  )}
  ```
- Replace inline empty state with shared `<EmptyState>`:
  ```tsx
  <EmptyState
    icon={<CheckSquare className="h-10 w-10" />}
    title={t('myTasks.allCaughtUp')}
  />
  ```

### Step 3: Simplify project-header.tsx
Remove:
- `useState` for `searchOpen`
- `Button` for search
- `NotificationBell` import
- `CommandPalette` import and rendering
- All search-related JSX

Keep:
- Project name with color dot
- View tabs (board/list/calendar/overview/timeline)
- `bg-white` -> `bg-background`
- `text-neutral-900` -> `text-foreground`

Result: ~50 lines, single responsibility (project identity + view switching).

### Step 4: Update goals-list.tsx
- Remove inline `EmptyState` function (lines 107-116)
- Import shared `EmptyState` from `@/shared/components/ui/empty-state`
- Update empty state usage to pass correct props
- Skeleton grid: already exists (lines 66-70) but uses `bg-neutral-50` -> `bg-muted`

### Step 5: Sweep overview.tsx
- Read file, add skeleton for loading state
- Fix any hardcoded colors

### Step 6: Board page token sweep
- `board.tsx` -- check for hardcoded colors in wrapper divs
- Minimal changes expected -- mostly delegated to sub-components

### Step 7: Compile check
Run `tsc --noEmit`.

## Todo List
- [ ] Create `my-tasks-row.tsx`
- [ ] Create `my-tasks-bucket.tsx`
- [ ] Rewrite `my-tasks.tsx` (skeleton, empty state, no Header)
- [ ] Simplify `project-header.tsx`
- [ ] Update `goals-list.tsx` to use shared EmptyState
- [ ] Add skeleton to `overview.tsx`
- [ ] Token sweep on `board.tsx`
- [ ] Compile check
- [ ] Verify all PMS pages render correctly

## Success Criteria
- My Tasks shows skeleton while loading, proper empty state when no tasks
- Project header is simplified (no search/bell duplication)
- Goals page uses shared `EmptyState` component
- All files under 200 lines
- All colors use semantic tokens
- TypeScript compiles without errors

## Risk Assessment
- **Risk:** Removing `<Header>` from my-tasks changes page layout
  - **Mitigation:** Shell header (Phase 3) now provides the title via breadcrumbs
- **Risk:** project-header.tsx removing search may confuse users who expect search there
  - **Mitigation:** Search is now always visible in shell header (Cmd+K shortcut unchanged)

## Security Considerations
None -- purely frontend UI changes.
