# Phase 09 — Frontend: Project Views (Board, List, Calendar)

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Project page with Board/List/Calendar views, drag-drop, filters, quick-add

## Context Links
- [Wireframe 03 - Board](../../docs/wireframe/03-project-board.html)
- [Wireframe 05 - List](../../docs/wireframe/05-project-list-view.html)
- [Design Guidelines](../../docs/design-guidelines.md) §4 Kanban

## Related Code Files

### Create
```
frontend/src/features/projects/
  api/projects.api.ts
  api/tasks.api.ts
  api/sections.api.ts
  hooks/useProject.ts
  hooks/useTasks.ts
  hooks/useSections.ts
  hooks/useTaskMutations.ts
  pages/ProjectPage.tsx          # view switcher + shared header
  components/
    ProjectHeader.tsx            # name, view tabs, filter bar, add button
    FilterBar.tsx
    board/
      BoardView.tsx              # DnD columns
      BoardColumn.tsx
      TaskCard.tsx               # Kanban card
      AddTaskInline.tsx
    list/
      ListView.tsx
      SectionRow.tsx             # collapsible section header
      TaskRow.tsx                # list row with columns
    calendar/
      CalendarView.tsx           # month grid
      CalendarDay.tsx
      CalendarTaskChip.tsx
```

## Implementation Steps

### 1. Data fetching hooks
```typescript
// hooks/useTasks.ts
export function useTasks(projectId: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => tasksApi.list(projectId, filters),
    staleTime: 30_000,
  })
}

// hooks/useTaskMutations.ts — reorder, create, update, complete
export function useReorderTasks(projectId: string) {
  return useMutation({
    mutationFn: tasksApi.reorder,
    onMutate: async (updates) => {
      // Optimistic update: immediately move card in cache
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })
      const previous = queryClient.getQueryData(['tasks', projectId])
      queryClient.setQueryData(['tasks', projectId], (old) => applyReorder(old, updates))
      return { previous }
    },
    onError: (_, __, ctx) => queryClient.setQueryData(['tasks', projectId], ctx?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}
```

### 2. Board View (@dnd-kit)
```typescript
// BoardView.tsx
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

function BoardView({ projectId, sections, tasks }) {
  const [activeTask, setActiveTask] = useState(null)
  const reorder = useReorderTasks(projectId)

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTask = findTask(active.id)
    const overSection = findSection(over.id) ?? findTaskSection(over.id)

    // Calculate new position (fractional between neighbors)
    const newPosition = calcNewPosition(overSection.tasks, over.id)
    reorder.mutate([{ id: active.id, section_id: overSection.id, position: newPosition }])
    setActiveTask(null)
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={...} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto h-full p-4">
        {sections.map(section => (
          <BoardColumn key={section.id} section={section} tasks={tasks[section.id]} />
        ))}
        <AddSectionButton />
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
```

**BoardColumn.tsx:**
- Header: colored left border (section.color), name, task count badge
- `SortableContext` wrapping task cards
- Inline "+ Add task" form at bottom (toggle on click)

**TaskCard.tsx** (per design spec):
- White card, 1px border, 8px radius, 12px padding
- Priority dot (colored by priority)
- Title (2-line clamp)
- Tag chips (max 3 visible)
- Assignee avatar + due date (bottom row)
- Click → open task detail drawer (Sheet)

### 3. List View
```typescript
// ListView.tsx
// Collapsible sections with task rows
// Columns: ☐ | Priority | Task Name | Assignee | Due Date | Tags | Status
// TanStack Table for sorting + column management (later)

function SectionRow({ section, tasks, projectId }) {
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="section-header" onClick={() => setCollapsed(c => !c)}>
        <ChevronDown className={collapsed ? '-rotate-90' : ''} size={16} />
        <span className="font-semibold text-sm">{section.name}</span>
        <span className="text-xs text-neutral-400 ml-2">{tasks.length}</span>
      </div>
      {!collapsed && (
        <>
          {tasks.map(task => <TaskRow key={task.id} task={task} />)}
          {adding ? <InlineTaskForm onDone={() => setAdding(false)} sectionId={section.id} />
                  : <AddTaskButton onClick={() => setAdding(true)} />}
        </>
      )}
    </div>
  )
}
```

**TaskRow.tsx:**
- 32px height, hover = Neutral-50 fill
- Hover reveals action icons (edit, move, delete) on right
- Inline checkbox for complete toggle
- Click task name → open task detail drawer

### 4. Calendar View
```typescript
// CalendarView.tsx
// month grid using date-fns
// Task chips on each day cell (due_date match)
// Click day → quick add task with that due date
// Task chip click → open task detail drawer
// Month navigation arrows

function CalendarView({ tasks }) {
  const [month, setMonth] = useState(new Date())
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const tasksByDate = groupBy(tasks.filter(t => t.due_date), t => format(t.due_date, 'yyyy-MM-dd'))

  return (
    <div className="calendar-grid">
      <CalendarHeader month={month} onPrev={() => setMonth(subMonths(month, 1))} onNext={...} />
      <div className="grid grid-cols-7">
        {days.map(day => (
          <CalendarDay key={day} day={day} tasks={tasksByDate[format(day, 'yyyy-MM-dd')] ?? []} />
        ))}
      </div>
    </div>
  )
}
```

### 5. Filter Bar
```typescript
// FilterBar.tsx
// Filters: Assignee (multi-select dropdown), Priority (badge group), Due date (date range picker), Status, Tags
// Active filters shown as dismissible chips
// "Clear all" link

interface TaskFilters {
  assignee_ids?: string[]
  priorities?: TaskPriority[]
  statuses?: TaskStatus[]
  tag_ids?: string[]
  due_before?: string
  due_after?: string
}
```

### 6. Quick-add task inline
```typescript
// AddTaskInline.tsx — shared between Board (column footer) + List (section footer)
// Shows: title input (focus on mount) + assignee picker + due date picker
// Enter → create task | Escape → cancel
// Tab moves between fields
```

### 7. Global search (cmdk)
```typescript
// In TopBar: Ctrl+K opens CommandDialog
import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from 'cmdk'

// Search API call with 300ms debounce
// Groups: Tasks, Projects
// Item click → navigate to project or open task detail
```

## Todo
- [ ] Create all API files (projects, tasks, sections)
- [ ] Create data fetching hooks with TanStack Query
- [ ] Build BoardView with @dnd-kit (intra + inter column DnD)
- [ ] Build BoardColumn + TaskCard per design spec
- [ ] Build ListView with collapsible sections + TaskRow
- [ ] Build CalendarView with date-fns month grid
- [ ] Build FilterBar with all filter options
- [ ] Build AddTaskInline (shared)
- [ ] Integrate cmdk command palette in TopBar
- [ ] Implement optimistic updates for task reorder
- [ ] Test: drag task between columns → position updates in DB

## Success Criteria
- Board DnD: card drops in new column, position persists on reload
- List view: sections collapse/expand, tasks sortable
- Calendar: tasks appear on correct day, click day opens add form
- Filters: applied filters narrow task list correctly
- cmdk: Ctrl+K opens, search results appear, click navigates
- Optimistic update: card moves instantly, reverts on error

## Risk Assessment
- @dnd-kit + sortable: watch for collision detection mode (closestCenter vs closestCorners for multi-column)
- Fractional position normalization: when float precision gets too low, trigger backend re-normalization

## Next Steps
→ Phase 10: task detail drawer
