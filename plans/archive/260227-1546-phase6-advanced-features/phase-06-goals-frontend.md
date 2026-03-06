# Phase 6: Goals/Portfolio Frontend

## Overview

- **Priority:** P2
- **Status:** complete
- **Effort:** 2.5 days
- **Depends on:** Phase 5

Goals list page (cards with progress bars), goal detail drawer, link-projects dialog,
sidebar navigation entry, and routing.

## Architecture

- New feature folder: `frontend/src/features/goals/`
- Goals page at `/goals` route (workspace-level, not project-level)
- Goal detail in a Sheet drawer (same pattern as task detail drawer)
- Link dialog uses existing project list + task search for linking

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/features/goals/hooks/use-goals.ts` | Query/mutation hooks (~80 lines) |
| `frontend/src/features/goals/pages/goals-list.tsx` | Goal cards grid page (~150 lines) |
| `frontend/src/features/goals/components/goal-card.tsx` | Single goal card (~80 lines) |
| `frontend/src/features/goals/components/goal-detail-drawer.tsx` | Detail drawer (~180 lines) |
| `frontend/src/features/goals/components/create-goal-dialog.tsx` | Create goal form (~100 lines) |
| `frontend/src/features/goals/components/link-projects-dialog.tsx` | Link/unlink projects (~100 lines) |
| `frontend/src/features/goals/components/link-tasks-dialog.tsx` | Link/unlink tasks (~100 lines) |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/app/router.tsx` | Add `/goals` route |
| `frontend/src/features/auth/components/sidebar.tsx` | Add "Goals" nav item |

## Implementation Steps

### 1. Hooks (`use-goals.ts`)

```typescript
interface Goal {
  id: string; workspace_id: string; title: string; description: string | null
  status: string; progress_value: number; calculation_method: string
  color: string; owner_id: string; due_date: string | null
  created_at: string; updated_at: string
  owner_name: string | null
  linked_project_count: number; linked_task_count: number
}

export function useGoals(workspaceId: string) {
  return useQuery<Goal[]>({
    queryKey: ['goals', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/goals`).then(r => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateGoal(workspaceId: string) { ... }
export function useUpdateGoal(workspaceId: string) { ... }
export function useDeleteGoal(workspaceId: string) { ... }
export function useLinkProject(workspaceId: string, goalId: string) { ... }
export function useUnlinkProject(workspaceId: string, goalId: string) { ... }
export function useLinkTask(workspaceId: string, goalId: string) { ... }
export function useUnlinkTask(workspaceId: string, goalId: string) { ... }
```

### 2. Goal Card (`goal-card.tsx`)

Card layout:
- Color bar on left edge (4px wide, goal.color)
- Title + status badge (on_track=green, at_risk=yellow, off_track=red, achieved=blue, dropped=gray)
- Progress bar (shadcn-style div with width % and bg color)
- Owner avatar + name (bottom-left)
- Due date (bottom-right, red if overdue)
- Linked counts: "3 projects, 12 tasks" (text-xs text-neutral-400)
- onClick opens goal detail drawer

### 3. Goals List Page (`goals-list.tsx`)

- Header: "Goals" title + "New goal" button
- Grid of GoalCard components (2-3 columns responsive)
- Filter by status (optional, simple select dropdown)
- Empty state: "No goals yet. Create one to track your team's progress."
- Uses `useGoals(workspaceId)` from workspace store

### 4. Create Goal Dialog (`create-goal-dialog.tsx`)

Form fields:
- Title (required)
- Description (textarea, optional)
- Owner (select from workspace members)
- Color picker (reuse COLORS array)
- Due date (date input)
- Calculation method: radio "Manual" / "Auto (from linked tasks)"
- Status select: on_track (default), at_risk, off_track

### 5. Goal Detail Drawer (`goal-detail-drawer.tsx`)

Sheet drawer (480px, same as task detail):
- Header: title (contentEditable) + color dot + delete button
- Meta rows (same MetaRow pattern):
  - Status: select dropdown
  - Owner: member select
  - Due date: date input
  - Progress: progress bar + value (editable if manual; read-only if auto)
  - Calculation: radio toggle manual/auto
- Description (contentEditable)
- Linked Projects section:
  - List linked projects with color dot + name
  - "Link project" button opens LinkProjectsDialog
  - Unlink button (X) on each linked project
- Linked Tasks section:
  - List linked tasks with completion status
  - "Link task" button opens LinkTasksDialog
  - Unlink button (X) on each linked task

### 6. Link Projects Dialog (`link-projects-dialog.tsx`)

- Dialog with checkbox list of all workspace projects
- Pre-checked for already linked projects
- Toggle links on check/uncheck (call link/unlink API)
- Search input to filter project list

### 7. Link Tasks Dialog (`link-tasks-dialog.tsx`)

- Dialog with project selector dropdown first
- Then list tasks from selected project
- Checkbox to link/unlink tasks
- Search input to filter tasks

### 8. Add route (`router.tsx`)

```tsx
const GoalsPage = lazy(() => import('@/features/goals/pages/goals-list'))

// Inside RequireAuth Routes:
<Route path="/goals" element={<GoalsPage />} />
```

### 9. Add sidebar nav item (`sidebar.tsx`)

Add between "My Tasks" and "Members":
```tsx
<NavItem to="/goals" icon={<Target className="h-4 w-4" />} label="Goals" active={isActive('/goals')} />
```

Import `Target` from lucide-react.

## Todo

- [ ] Create `use-goals.ts` hooks
- [ ] Create `goal-card.tsx` component
- [ ] Create `goals-list.tsx` page
- [ ] Create `create-goal-dialog.tsx`
- [ ] Create `goal-detail-drawer.tsx`
- [ ] Create `link-projects-dialog.tsx`
- [ ] Create `link-tasks-dialog.tsx`
- [ ] Add `/goals` route to router
- [ ] Add "Goals" to sidebar navigation
- [ ] Manual test full flow: create goal, link projects/tasks, verify progress

## Success Criteria

- Goals list page accessible from sidebar, shows cards with progress bars
- Create dialog produces goal visible in list
- Detail drawer allows editing all fields inline
- Link/unlink projects and tasks works from detail drawer
- Auto progress updates when linked tasks are completed
- Status badges render with correct colors
- Empty states displayed for no goals and no linked items
- Responsive grid layout (1 col mobile, 2-3 cols desktop)
