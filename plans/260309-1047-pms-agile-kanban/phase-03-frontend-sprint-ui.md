# Phase 3: Frontend Sprint UI

## Context Links
- [Phase 2 — Backend API](./phase-02-backend-api.md)
- [Board page](../../frontend/src/modules/pms/features/projects/pages/board.tsx)
- [Project header](../../frontend/src/modules/pms/features/projects/components/project-header.tsx)
- [Board kanban column](../../frontend/src/modules/pms/features/projects/components/board-kanban-column.tsx)
- [Task detail drawer](../../frontend/src/modules/pms/features/tasks/components/task-detail-drawer.tsx)
- [use-project-tasks hook](../../frontend/src/modules/pms/features/projects/hooks/use-project-tasks.ts)
- [Frontend router](../../frontend/src/app/router.tsx)
- [Filter bar](../../frontend/src/modules/pms/features/projects/components/filter-bar.tsx)

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 5h
- **Depends on:** Phase 2
- **Description:** (Merged from 260309-1107) Project type selector in create dialog + conditional view tabs in project-header; PLUS sprint selector on board, backlog page, sprints stub page, sprint management dialog, task form agile fields, WIP limit display. Can run in parallel with Phase 4 (analytics).

## Requirements

### Functional
- **Project type selector** in create dialog — 3 visual cards (Basic / Kanban / Agile) with descriptions
- **Conditional header tabs** in `project-header.tsx` — tabs filtered by `project.project_type`
- **Default navigation** — basic→`/list`, kanban/agile→`/board`
- Sprint selector dropdown on board view (backlog / Sprint 1 / Sprint 2...)
- Backlog page at `/pms/projects/:id/backlog` — list view of unassigned-to-sprint tasks
- Sprints stub page at `/pms/projects/:id/sprints` (real implementation in Phase 4)
- Sprint management dialog — create, start, complete sprints
- Task detail drawer enhancements — story_points input, task_type select, sprint assignment
- Section WIP limit display in column header (count/limit, red when exceeded)

### Non-Functional
- All new components under 200 lines
- Use existing shadcn/ui components (Dialog, Select, Badge, Button)
- TanStack Query for all server state, no extra Zustand stores
- kebab-case file names

## Architecture

### Component Tree (board view with sprint)

```
BoardPage
  ProjectHeader (modified -- add "Backlog" tab)
  FilterBar (existing)
  SprintSelector (new -- dropdown above board)
  DndContext
    BoardKanbanColumn[] (modified -- show WIP limit)
      BoardTaskCard[] (modified -- show story points badge + task type)
    BoardAddSectionInput

TaskDetailDrawer (modified -- add sprint/points/type fields)

SprintManageDialog (new -- create/start/complete sprints)
```

### New Route

```
/pms/projects/:projectId/backlog  ->  BacklogPage (new)
```

## Related Code Files

### Files to CREATE
1. `frontend/src/modules/pms/features/projects/components/sprint-selector.tsx`
2. `frontend/src/modules/pms/features/projects/components/sprint-manage-dialog.tsx`
3. `frontend/src/modules/pms/features/projects/pages/backlog.tsx`
4. `frontend/src/modules/pms/features/projects/pages/sprints.tsx` -- stub page (full impl in Phase 4)
5. `frontend/src/modules/pms/features/projects/hooks/use-sprints.ts`
6. `frontend/src/modules/pms/features/projects/hooks/use-backlog-tasks.ts`
7. `frontend/src/modules/pms/features/projects/components/project-type-selector.tsx` -- 3-card type picker used in dialog

### Files to MODIFY
1. `frontend/src/modules/pms/features/projects/components/create-project-dialog.tsx` -- add ProjectTypeSelector, pass project_type in POST, fix default navigation
2. `frontend/src/modules/pms/features/projects/components/project-header.tsx` -- conditional tabs by project_type, add Backlog + Sprints tabs
3. `frontend/src/modules/pms/features/projects/pages/board.tsx` -- add SprintSelector, filter tasks by sprint
4. `frontend/src/modules/pms/features/projects/components/board-kanban-column.tsx` -- show WIP limit
5. `frontend/src/modules/pms/features/projects/hooks/use-project-tasks.ts` -- add agile fields to Task/Section interfaces
6. `frontend/src/modules/pms/features/tasks/components/task-detail-drawer.tsx` -- add sprint/points/type fields
7. `frontend/src/modules/pms/features/projects/components/board-task-card.tsx` -- show story points + task type icon
8. `frontend/src/app/router.tsx` -- add backlog + sprints routes

## Implementation Steps

### Step 0: Create `project-type-selector.tsx` component

Create `frontend/src/modules/pms/features/projects/components/project-type-selector.tsx`:

```tsx
import { LayoutGrid, List, Layers } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type ProjectType = 'basic' | 'kanban' | 'agile'

const TYPES = [
  { key: 'basic' as const, label: 'Basic', icon: List, description: 'Simple lists, calendar, timeline' },
  { key: 'kanban' as const, label: 'Kanban', icon: LayoutGrid, description: 'Visual board with columns' },
  { key: 'agile' as const, label: 'Agile', icon: Layers, description: 'Sprints, backlog, story points' },
]

interface Props {
  value: ProjectType
  onChange: (type: ProjectType) => void
}

export function ProjectTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TYPES.map(({ key, label, icon: Icon, description }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
            value === key
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[10px] leading-tight">{description}</span>
        </button>
      ))}
    </div>
  )
}
```

### Step 0b: Update `create-project-dialog.tsx`

1. Import `ProjectTypeSelector` and `ProjectType`
2. Add state: `const [projectType, setProjectType] = useState<ProjectType>('kanban')`
3. Add `<ProjectTypeSelector value={projectType} onChange={setProjectType} />` above the name input field
4. Add `project_type: projectType` to POST body
5. Fix navigation: `navigate(\`/pms/projects/${data.id}/${projectType === 'basic' ? 'list' : 'board'}\`)`
6. Reset on close: `setProjectType('kanban')`

### Step 0c: Update `project-header.tsx` for conditional tabs

Replace static `VIEWS` array with:

```tsx
interface Project { id: string; name: string; color: string; project_type: string }

type View = 'board' | 'list' | 'backlog' | 'sprints' | 'calendar' | 'overview' | 'timeline'

const ALL_VIEWS: { key: View; label: string; icon: LucideIcon; types: string[] }[] = [
  { key: 'board',     label: t('project.views.board'),    icon: LayoutGrid, types: ['kanban', 'agile'] },
  { key: 'list',      label: t('project.views.list'),     icon: List,       types: ['basic', 'kanban', 'agile'] },
  { key: 'backlog',   label: t('project.views.backlog'),  icon: Inbox,      types: ['agile'] },
  { key: 'sprints',   label: t('project.views.sprints'),  icon: Layers,     types: ['agile'] },
  { key: 'calendar',  label: t('project.views.calendar'), icon: Calendar,   types: ['basic', 'kanban', 'agile'] },
  { key: 'overview',  label: t('project.views.overview'), icon: BarChart2,  types: ['basic', 'kanban', 'agile'] },
  { key: 'timeline',  label: t('project.views.timeline'), icon: GanttChart, types: ['basic', 'kanban', 'agile'] },
]

// Inside component:
const VIEWS = ALL_VIEWS.filter(v => v.types.includes(project?.project_type ?? 'kanban'))
```

Add i18n keys to `public/locales/en/pms.json` and `vi/pms.json`:
- `project.views.backlog`: `"Backlog"` / `"Tồn đọng"`
- `project.views.sprints`: `"Sprints"` / `"Sprint"`

### Step 1: Update Task and Section interfaces

In `frontend/src/modules/pms/features/projects/hooks/use-project-tasks.ts`:

Add to `Section` interface:
```typescript
wip_limit: number | null
```

Add to `Task` interface after `custom_fields`:
```typescript
// Agile fields
story_points: number | null
task_type: string  // 'task' | 'story' | 'bug' | 'epic'
sprint_id: string | null
epic_id: string | null
```

### Step 2: Create sprints hook

Create `frontend/src/modules/pms/features/projects/hooks/use-sprints.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: string  // 'planning' | 'active' | 'completed'
  created_by_id: string
  created_at: string
  updated_at: string
  task_count: number
  completed_points: number
  total_points: number
}

export function useSprints(projectId: string, statusFilter?: string) {
  const params = statusFilter ? `?status=${statusFilter}` : ''
  return useQuery<Sprint[]>({
    queryKey: ['sprints', projectId, statusFilter],
    queryFn: () => api.get(`/pms/projects/${projectId}/sprints${params}`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useActiveSprint(projectId: string) {
  const { data: sprints = [] } = useSprints(projectId, 'active')
  return sprints[0] ?? null
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; goal?: string; start_date?: string; end_date?: string }) =>
      api.post(`/pms/projects/${projectId}/sprints`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  })
}

export function useStartSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) =>
      api.post(`/pms/projects/${projectId}/sprints/${sprintId}/start`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  })
}

export function useCompleteSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) =>
      api.post(`/pms/projects/${projectId}/sprints/${sprintId}/complete`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}
```

### Step 3: Create backlog tasks hook

Create `frontend/src/modules/pms/features/projects/hooks/use-backlog-tasks.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Task } from './use-project-tasks'

export function useBacklogTasks(projectId: string) {
  return useQuery<Task[]>({
    queryKey: ['backlog', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}/backlog`).then((r) => r.data),
    enabled: !!projectId,
  })
}
```

### Step 4: Create SprintSelector component

Create `frontend/src/modules/pms/features/projects/components/sprint-selector.tsx`:

```tsx
import { useState } from 'react'
import { ChevronDown, Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import { useSprints, type Sprint } from '../hooks/use-sprints'
import { SprintManageDialog } from './sprint-manage-dialog'

interface Props {
  projectId: string
  selectedSprintId: string | null  // null = backlog
  onSelect: (sprintId: string | null) => void
}

export function SprintSelector({ projectId, selectedSprintId, onSelect }: Props) {
  const { t } = useTranslation('pms')
  const { data: sprints = [] } = useSprints(projectId)
  const [manageOpen, setManageOpen] = useState(false)

  const selected = sprints.find((s) => s.id === selectedSprintId)
  const label = selected ? selected.name : 'Backlog'

  const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'success'> = {
    planning: 'secondary',
    active: 'default',
    completed: 'success',
  }

  return (
    <>
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-background">
        <span className="text-xs font-medium text-muted-foreground">Sprint:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              {label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => onSelect(null)}>
              Backlog
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {sprints.filter((s) => s.status !== 'completed').map((sprint) => (
              <DropdownMenuItem key={sprint.id} onClick={() => onSelect(sprint.id)}>
                <span className="flex-1 truncate">{sprint.name}</span>
                <Badge variant={STATUS_COLORS[sprint.status] ?? 'secondary'} className="text-[10px] ml-2">
                  {sprint.status}
                </Badge>
              </DropdownMenuItem>
            ))}
            {sprints.some((s) => s.status === 'completed') && (
              <>
                <DropdownMenuSeparator />
                {sprints.filter((s) => s.status === 'completed').slice(0, 5).map((sprint) => (
                  <DropdownMenuItem key={sprint.id} onClick={() => onSelect(sprint.id)} className="opacity-60">
                    <span className="flex-1 truncate">{sprint.name}</span>
                    <Badge variant="secondary" className="text-[10px] ml-2">done</Badge>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setManageOpen(true)}>
              <Settings className="h-3.5 w-3.5 mr-2" />
              Manage Sprints
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SprintManageDialog
        projectId={projectId}
        open={manageOpen}
        onOpenChange={setManageOpen}
      />
    </>
  )
}
```

### Step 5: Create SprintManageDialog

Create `frontend/src/modules/pms/features/projects/components/sprint-manage-dialog.tsx`:

```tsx
import { useState } from 'react'
import { Play, CheckCircle2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useSprints, useCreateSprint, useStartSprint, useCompleteSprint } from '../hooks/use-sprints'

interface Props {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SprintManageDialog({ projectId, open, onOpenChange }: Props) {
  const { t } = useTranslation('pms')
  const { data: sprints = [] } = useSprints(projectId)
  const createSprint = useCreateSprint(projectId)
  const startSprint = useStartSprint(projectId)
  const completeSprint = useCompleteSprint(projectId)
  const [newName, setNewName] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    createSprint.mutate({ name: newName.trim() })
    setNewName('')
  }

  const activeSprints = sprints.filter((s) => s.status !== 'completed')
  const completedSprints = sprints.filter((s) => s.status === 'completed')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Sprints</DialogTitle>
        </DialogHeader>

        {/* Create new sprint */}
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New sprint name..."
            className="flex-1 text-sm border border-border rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create
          </Button>
        </div>

        {/* Active / planning sprints */}
        <div className="space-y-2 mt-2">
          {activeSprints.map((sprint) => (
            <div key={sprint.id} className="flex items-center gap-2 p-2 rounded border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{sprint.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sprint.task_count} tasks | {sprint.completed_points}/{sprint.total_points} pts
                </p>
              </div>
              <Badge variant={sprint.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                {sprint.status}
              </Badge>
              {sprint.status === 'planning' && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Start sprint"
                  onClick={() => startSprint.mutate(sprint.id)}
                >
                  <Play className="h-3.5 w-3.5 text-green-600" />
                </Button>
              )}
              {sprint.status === 'active' && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Complete sprint"
                  onClick={() => {
                    if (window.confirm('Complete this sprint? Incomplete tasks stay in backlog.'))
                      completeSprint.mutate(sprint.id)
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Completed sprints (collapsed) */}
        {completedSprints.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              {completedSprints.length} completed sprint(s)
            </summary>
            <div className="space-y-1 mt-1">
              {completedSprints.slice(0, 5).map((sprint) => (
                <div key={sprint.id} className="flex items-center gap-2 p-1.5 text-xs opacity-60">
                  <span className="truncate flex-1">{sprint.name}</span>
                  <span className="text-muted-foreground">{sprint.completed_points} pts</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

### Step 6: Modify board.tsx -- add sprint filtering

In `frontend/src/modules/pms/features/projects/pages/board.tsx`:

1. Add imports at top:
```tsx
import { SprintSelector } from '../components/sprint-selector'
import { useBacklogTasks } from '../hooks/use-backlog-tasks'
```

2. Add state for selected sprint:
```tsx
const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
```

3. Replace the `useTasks` data with sprint-aware filtering. When `selectedSprintId` is null, show backlog tasks. When set, filter tasks by sprint_id:
```tsx
// In the component body:
const { data: allTasks = [] } = useTasks(projectId!)
const { data: backlogTasks = [] } = useBacklogTasks(projectId!)

// Tasks to display based on sprint selection
const tasks = selectedSprintId
  ? allTasks.filter((t) => t.sprint_id === selectedSprintId)
  : backlogTasks
```

4. Add `<SprintSelector>` between `<FilterBar>` and the board content:
```tsx
<SprintSelector
  projectId={projectId!}
  selectedSprintId={selectedSprintId}
  onSelect={setSelectedSprintId}
/>
```

**IMPORTANT:** Keep board.tsx under 200 lines. The sprint selector is its own component so this adds only ~8 lines to board.tsx.

### Step 7: Modify board-kanban-column.tsx -- WIP limit display

In the column header, after the task count span, add WIP limit indicator:

```tsx
<span className="text-xs text-neutral-400 flex-shrink-0">
  {tasks.length}
  {section.wip_limit && (
    <span className={tasks.length > section.wip_limit ? ' text-red-500 font-medium' : ''}>
      /{section.wip_limit}
    </span>
  )}
</span>
```

Also add visual cue when WIP limit exceeded -- add to the column wrapper div:
```tsx
className={cn(
  'flex w-64 flex-shrink-0 flex-col gap-2',
  section.wip_limit && tasks.length > section.wip_limit && 'ring-1 ring-red-300 rounded-lg'
)}
```

### Step 8: Modify board-task-card.tsx -- story points + task type

Add story points badge and task type indicator to the card footer area.

After the priority badge in the bottom row, add:
```tsx
{task.story_points != null && task.story_points > 0 && (
  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
    {task.story_points} SP
  </Badge>
)}
```

For task type, add a small icon/badge before the title:
```tsx
const TASK_TYPE_ICONS: Record<string, string> = {
  story: 'S',
  bug: 'B',
  epic: 'E',
  task: '',
}

// Before {task.title} in the title line:
{task.task_type !== 'task' && (
  <span className={cn(
    'inline-flex items-center justify-center h-4 w-4 rounded text-[9px] font-bold mr-1 flex-shrink-0',
    task.task_type === 'bug' && 'bg-red-100 text-red-600',
    task.task_type === 'story' && 'bg-blue-100 text-blue-600',
    task.task_type === 'epic' && 'bg-purple-100 text-purple-600',
  )}>
    {TASK_TYPE_ICONS[task.task_type]}
  </span>
)}
```

### Step 9: Modify task-detail-drawer.tsx -- add agile meta rows

Add three new MetaRow entries in the meta section (after the Recurrence row):

```tsx
{/* Story Points */}
<MetaRow icon={<Hash className="h-4 w-4" />} label="Points">
  <input
    type="number"
    min={0}
    max={100}
    defaultValue={task.story_points ?? ''}
    onChange={(e) => {
      const val = e.target.value ? parseInt(e.target.value) : null
      updateTask.mutate({ story_points: val })
    }}
    className="text-xs bg-muted rounded px-2 py-1 border-0 outline-none w-16 text-foreground"
    placeholder="--"
  />
</MetaRow>

{/* Task Type */}
<MetaRow icon={<Layers className="h-4 w-4" />} label="Type">
  <Select
    value={task.task_type ?? 'task'}
    onValueChange={(v) => updateTask.mutate({ task_type: v })}
  >
    <SelectTrigger className="h-7 w-28 text-xs border-0 bg-muted hover:bg-muted/80">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="task">Task</SelectItem>
      <SelectItem value="story">Story</SelectItem>
      <SelectItem value="bug">Bug</SelectItem>
      <SelectItem value="epic">Epic</SelectItem>
    </SelectContent>
  </Select>
</MetaRow>

{/* Sprint Assignment */}
<MetaRow icon={<Zap className="h-4 w-4" />} label="Sprint">
  <SprintAssignSelect
    projectId={projectId}
    value={task.sprint_id}
    onChange={(v) => updateTask.mutate({ sprint_id: v })}
  />
</MetaRow>
```

Import `Hash`, `Layers`, `Zap` from lucide-react.

The `SprintAssignSelect` is a small inline component (or extract from useSprints):
```tsx
function SprintAssignSelect({ projectId, value, onChange }: {
  projectId: string; value: string | null; onChange: (v: string | null) => void
}) {
  const { data: sprints = [] } = useSprints(projectId)
  return (
    <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
      <SelectTrigger className="h-7 w-36 text-xs border-0 bg-muted hover:bg-muted/80">
        <SelectValue placeholder="No sprint" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No sprint</SelectItem>
        {sprints.filter((s) => s.status !== 'completed').map((s) => (
          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

**WARNING:** task-detail-drawer.tsx is already 512 lines. Extract the SprintAssignSelect to avoid further bloat. Consider extracting the entire "meta section" into a separate component `task-detail-meta.tsx` if needed to stay under 200 lines per file. This is a pre-existing issue but should be addressed.

### Step 10: Create Backlog page

Create `frontend/src/modules/pms/features/projects/pages/backlog.tsx`:

```tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { ProjectHeader } from '../components/project-header'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { useBacklogTasks } from '../hooks/use-backlog-tasks'
import type { Task } from '../hooks/use-project-tasks'
import api from '@/shared/lib/api'

const TYPE_STYLES: Record<string, string> = {
  bug: 'bg-red-100 text-red-600',
  story: 'bg-blue-100 text-blue-600',
  epic: 'bg-purple-100 text-purple-600',
  task: 'bg-neutral-100 text-neutral-600',
}

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: tasks = [] } = useBacklogTasks(projectId!)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="backlog" />
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-3">
            <span className="flex-1">Task</span>
            <span className="w-16 text-center">Type</span>
            <span className="w-12 text-center">Points</span>
            <span className="w-20 text-right">Priority</span>
          </div>
          {tasks.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tasks in backlog. Assign tasks to a sprint from the board view.
            </p>
          )}
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-muted/50 cursor-pointer"
            >
              <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>
              <Badge variant="secondary" className={cn('text-[10px] w-14 justify-center', TYPE_STYLES[task.task_type])}>
                {task.task_type}
              </Badge>
              <span className="w-12 text-center text-xs text-muted-foreground">
                {task.story_points ?? '--'}
              </span>
              <span className="w-20 text-right text-xs capitalize text-muted-foreground">
                {task.priority !== 'none' ? task.priority : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
      <TaskDetailDrawer
        task={selectedTask}
        projectId={projectId!}
        workspaceId={project?.workspace_id}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
```

### Step 11: Update ProjectHeader -- add Backlog tab

In `frontend/src/modules/pms/features/projects/components/project-header.tsx`:

1. Update the `View` type:
```typescript
type View = 'board' | 'list' | 'calendar' | 'overview' | 'timeline' | 'backlog'
```

2. Add backlog to VIEWS array (use `Layers` or `Inbox` icon from lucide):
```typescript
import { LayoutGrid, List, Calendar, BarChart2, GanttChart, Inbox } from 'lucide-react'

// In VIEWS array, add after 'timeline':
{ key: 'backlog' as const, label: t('project.views.backlog', 'Backlog'), icon: Inbox },
```

### Step 12: Register backlog route

In `frontend/src/app/router.tsx`:

1. Add lazy import:
```typescript
const BacklogPage = lazy(() => import('@/modules/pms/features/projects/pages/backlog'))
```

2. Add route in PMS section:
```tsx
<Route path="/pms/projects/:projectId/backlog" element={<BacklogPage />} />
```

## Todo List

- [ ] Update `Task` interface with agile fields in `use-project-tasks.ts`
- [ ] Update `Section` interface with `wip_limit` in `use-project-tasks.ts`
- [ ] Create `use-sprints.ts` hook
- [ ] Create `use-backlog-tasks.ts` hook
- [ ] Create `sprint-selector.tsx` component
- [ ] Create `sprint-manage-dialog.tsx` component
- [ ] Create `backlog.tsx` page
- [ ] Modify `board.tsx` -- add SprintSelector + sprint filtering
- [ ] Modify `board-kanban-column.tsx` -- WIP limit display
- [ ] Modify `board-task-card.tsx` -- story points badge + task type icon
- [ ] Modify `task-detail-drawer.tsx` -- add sprint/points/type meta rows
- [ ] Modify `project-header.tsx` -- add Backlog tab
- [ ] Register backlog route in `router.tsx`
- [ ] Verify board works with sprint selection
- [ ] Verify backlog page renders correctly

## Success Criteria

- Sprint selector dropdown appears on board view
- Selecting a sprint filters board to show only that sprint's tasks
- Selecting "Backlog" shows tasks without a sprint
- Sprint manage dialog can create/start/complete sprints
- Task detail drawer shows story_points, task_type, sprint selectors
- Board columns show WIP limit (count/limit) and red ring when exceeded
- Backlog page at `/pms/projects/:id/backlog` lists unsprinted tasks
- All new files under 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| task-detail-drawer.tsx already 512 lines (over limit) | Extract agile meta section into `task-detail-meta.tsx` helper; or add inline SprintAssignSelect as local component |
| Board.tsx complexity | Sprint selector is isolated component, only ~8 lines added to board.tsx |
| Backlog tasks stale after sprint assignment | Invalidate both `['tasks', projectId]` and `['backlog', projectId]` query keys on sprint changes |
| Missing i18n keys for new UI text | Add keys to pms namespace or use fallback strings initially |
