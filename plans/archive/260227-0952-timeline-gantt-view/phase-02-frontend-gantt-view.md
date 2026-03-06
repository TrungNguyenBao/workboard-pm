---
phase: 2
title: "Frontend: Timeline/Gantt View"
status: pending
effort: 3.5h
---

# Phase 2: Frontend -- Timeline/Gantt View

## Context

- [Calendar page](../../frontend/src/features/projects/pages/calendar.tsx) -- pattern for date-based view
- [Board page](../../frontend/src/features/projects/pages/board.tsx) -- pattern for section grouping + task detail drawer
- [Project hooks](../../frontend/src/features/projects/hooks/use-project-tasks.ts) -- Task type, useTasks, useSections
- [Project header](../../frontend/src/features/projects/components/project-header.tsx) -- VIEWS array + tab navigation
- [Router](../../frontend/src/app/router.tsx) -- lazy route pattern

## Architecture

```
timeline.tsx (page)
  -> ProjectHeader (activeView="timeline")
  -> TimelineGrid (scrollable container)
       -> time axis header (day columns)
       -> today marker (vertical line)
       -> section groups (collapsible)
            -> TimelineTaskBar (per task, draggable edges)
  -> TaskDetailDrawer (on bar click)
```

**Grid layout:** CSS Grid with 1 column per day. Each day column = fixed width (e.g., 40px for week zoom, 12px for month zoom). Total width = days * column-width, horizontal scroll.

**Date math:** `date-fns` -- `differenceInDays`, `eachDayOfInterval`, `addDays`, `startOfWeek`, `format`, `isToday`.

**Bar positioning:** `grid-column: start-col / end-col` where col index = `differenceInDays(taskDate, timelineStart) + 1`.

## Implementation Steps

### 1. Update Task Type + Add useUpdateTask Hook

File: `frontend/src/features/projects/hooks/use-project-tasks.ts`

Add `start_date: string | null` to Task interface (after `due_date`).

Add hook:
```typescript
export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Record<string, unknown>) =>
      api.patch(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}
```

### 2. Add Timeline Tab to ProjectHeader

File: `frontend/src/features/projects/components/project-header.tsx`

Import `GanttChart` from lucide-react (or `AlignLeft` as fallback).

Add to VIEWS array:
```typescript
{ key: 'timeline', label: 'Timeline', icon: GanttChart },
```

Update `View` type -- it auto-derives from VIEWS.

### 3. Add Route

File: `frontend/src/app/router.tsx`

```typescript
const TimelinePage = lazy(() => import('@/features/projects/pages/timeline'))
// Inside Routes:
<Route path="/projects/:projectId/timeline" element={<TimelinePage />} />
```

### 4. Create TimelineTaskBar Component

File: `frontend/src/features/projects/components/timeline-task-bar.tsx` (~80 lines)

Props: `task`, `timelineStart`, `dayWidth`, `onClickTask`, `onDatesChange`

Behavior:
- Render div with `position: absolute`, left/width computed from date offsets
- Left edge drag handle: changes `start_date`
- Right edge drag handle: changes `due_date`
- Color by priority (same PRIORITY colors from board)
- Completed tasks: muted/strikethrough
- Tasks with only `due_date` (no start): render as small diamond/dot
- Tooltip on hover: title, dates, assignee

Drag implementation:
```typescript
function handleDragStart(edge: 'left' | 'right', e: React.MouseEvent) {
  e.preventDefault()
  const startX = e.clientX
  const origStart = task.start_date
  const origDue = task.due_date

  function onMove(ev: MouseEvent) {
    const dx = ev.clientX - startX
    const daysDelta = Math.round(dx / dayWidth)
    // Preview: update bar width/position via local state
  }
  function onUp(ev: MouseEvent) {
    // Compute final dates, call onDatesChange({ start_date, due_date })
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
```

### 5. Create TimelineGrid Component

File: `frontend/src/features/projects/components/timeline-grid.tsx` (~120 lines)

Props: `tasks`, `sections`, `dayWidth`, `timelineStart`, `timelineEnd`, `onClickTask`, `onDatesChange`

Layout:
- **Left panel** (fixed ~200px): section names + task titles (sticky on horizontal scroll)
- **Right panel** (scrollable): CSS Grid with day columns

Renders:
- **Header row**: month labels + day numbers
- **Today marker**: red vertical line at today's column (`position: absolute`)
- **Section groups**: collapsible with chevron toggle
  - Task rows: each row contains a TimelineTaskBar
- **Unscheduled section**: tasks with no dates (shown at bottom, no bar)

### 6. Create Timeline Page

File: `frontend/src/features/projects/pages/timeline.tsx` (~100 lines)

Pattern follows calendar.tsx:
- `useTasks(projectId)`, `useSections(projectId)`, project query
- State: `selectedTask`, `timelineRange` (start/end dates), zoom level
- Default range: 2 weeks before today to 6 weeks after
- Navigation: prev/next buttons shift range by 2 weeks
- "Today" button centers on today
- Zoom toggle: "Weeks" (dayWidth=40) / "Months" (dayWidth=12)

```typescript
export default function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: tasks = [] } = useTasks(projectId!)
  const { data: sections = [] } = useSections(projectId!)
  const updateTask = useUpdateTask(projectId!)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [rangeStart, setRangeStart] = useState(addWeeks(new Date(), -2))
  const [zoom, setZoom] = useState<'week' | 'month'>('week')

  const dayWidth = zoom === 'week' ? 40 : 12
  const rangeEnd = zoom === 'week'
    ? addWeeks(rangeStart, 8)
    : addMonths(rangeStart, 6)

  function handleDatesChange(taskId: string, dates: { start_date?: string; due_date?: string }) {
    updateTask.mutate({ taskId, ...dates })
  }

  return (
    <>
      <ProjectHeader activeView="timeline" actions={/* nav + zoom controls */} />
      <TimelineGrid
        tasks={tasks}
        sections={sections}
        dayWidth={dayWidth}
        timelineStart={rangeStart}
        timelineEnd={rangeEnd}
        onClickTask={setSelectedTask}
        onDatesChange={handleDatesChange}
      />
      <TaskDetailDrawer task={selectedTask} projectId={projectId!} ... />
    </>
  )
}
```

## Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/features/projects/pages/timeline.tsx` | ~100 | Page container |
| `frontend/src/features/projects/components/timeline-grid.tsx` | ~120 | Grid layout + sections |
| `frontend/src/features/projects/components/timeline-task-bar.tsx` | ~80 | Draggable task bar |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/projects/hooks/use-project-tasks.ts` | Add `start_date` to Task, add `useUpdateTask` |
| `frontend/src/features/projects/components/project-header.tsx` | Add Timeline to VIEWS |
| `frontend/src/app/router.tsx` | Add timeline route |

## Todo

- [ ] Add `start_date` to Task interface in hooks
- [ ] Add `useUpdateTask` mutation hook
- [ ] Add Timeline tab to project-header VIEWS
- [ ] Add `/projects/:projectId/timeline` route
- [ ] Build TimelineTaskBar component with drag-resize
- [ ] Build TimelineGrid component with sections + today marker
- [ ] Build TimelinePage with nav + zoom controls
- [ ] Wire TaskDetailDrawer on bar click
- [ ] Handle unscheduled tasks (no dates)
- [ ] Test: navigate to timeline, verify bars render
- [ ] Test: drag bar edge, verify PATCH fires
- [ ] Run `make lint` and `make test`

## Success Criteria

- Timeline tab appears in project header, navigates to `/projects/:id/timeline`
- Tasks with start_date + due_date render as horizontal bars
- Tasks with only due_date render as dot/diamond markers
- Bars colored by priority, completed tasks muted
- Section groups collapsible
- Today marker visible as red vertical line
- Drag left/right edge of bar changes start_date/due_date via PATCH
- Click bar opens TaskDetailDrawer
- Horizontal scroll for long timelines, task names sticky on left
- Week/Month zoom toggle works

## Security Considerations

- No new endpoints; reuses existing PATCH `/tasks/:id` (RBAC: editor role required)
- Date validation in backend prevents `start_date > due_date`
