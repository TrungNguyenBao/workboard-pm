import { useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, Circle, Plus, MoreHorizontal, Pencil, Repeat, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { useSections, useTasks, useMoveTask, useCreateSection, useUpdateSection, useDeleteSection, type Task, type Section } from '../hooks/use-project-tasks'
import { InlineTaskInput } from '../components/inline-task-input'
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer'
import { ProjectHeader } from '../components/project-header'
import { FilterBar, type PriorityFilter, type StatusFilter } from '../components/filter-bar'
import api from '@/shared/lib/api'

type BadgeVariant = 'danger' | 'warning' | 'secondary'
const PRIORITY_COLORS: Record<string, BadgeVariant> = {
  high: 'danger',
  medium: 'warning',
  low: 'secondary',
  none: 'secondary',
}

function TaskCard({ task, isDragging, onOpen, projectId }: { task: Task; isDragging?: boolean; onOpen?: (t: Task) => void; projectId: string }) {
  const qc = useQueryClient()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const toggleComplete = useMutation({
    mutationFn: () =>
      api.patch(`/projects/${projectId}/tasks/${task.id}`, {
        status: task.status === 'completed' ? 'incomplete' : 'completed',
      }).then((r) => r.data),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['tasks', projectId] })
      const prev = qc.getQueryData<Task[]>(['tasks', projectId])
      qc.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old?.map((t) =>
          t.id === task.id
            ? { ...t, status: task.status === 'completed' ? 'incomplete' : 'completed' }
            : t
        ) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', projectId], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const isCompleted = task.status === 'completed'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group bg-white rounded-md border p-3 shadow-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
        isCompleted ? 'border-border opacity-60' : 'border-border',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); toggleComplete.mutate() }}
          className="mt-0.5 flex-shrink-0 text-neutral-300 hover:text-primary transition-colors"
          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted
            ? <CheckCircle2 className="h-4 w-4 text-primary" />
            : <Circle className="h-4 w-4" />
          }
        </button>
        <p
          className={cn(
            'text-sm leading-snug cursor-pointer flex-1',
            isCompleted
              ? 'line-through text-neutral-400'
              : 'text-neutral-900 hover:text-primary',
          )}
          onClick={(e) => { e.stopPropagation(); onOpen?.(task) }}
        >
          {task.title}
          {task.recurrence_rule && (
            <span className="inline-flex items-center ml-1 text-neutral-400" title={`Repeats ${task.recurrence_rule}`}>
              <Repeat className="h-3 w-3" />
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2 ml-6">
        <div className="flex items-center gap-2">
          {task.priority !== 'none' && (
            <Badge variant={PRIORITY_COLORS[task.priority]} className="text-xs">
              {task.priority}
            </Badge>
          )}
          {task.due_date && (
            <span className={cn(
              'text-xs',
              new Date(task.due_date) < new Date() && !isCompleted
                ? 'text-red-500 font-medium'
                : 'text-neutral-400',
            )}>
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.subtask_count > 0 && (
            <span className="text-xs text-neutral-400 flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" />
              {task.completed_subtask_count}/{task.subtask_count}
            </span>
          )}
        </div>
        {task.assignee_name && (
          <Avatar className="h-5 w-5 flex-shrink-0" title={task.assignee_name}>
            <AvatarImage src={task.assignee_avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {task.assignee_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ section, tasks, projectId, onOpenTask }: { section: Section; tasks: Task[]; projectId: string; onOpenTask: (t: Task) => void }) {
  const taskIds = tasks.map((t) => t.id)
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(section.name)
  const updateSection = useUpdateSection(projectId)
  const deleteSection = useDeleteSection(projectId)

  function commitRename() {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== section.name) {
      updateSection.mutate({ sectionId: section.id, name: trimmed })
    }
    setRenaming(false)
  }

  return (
    <div className="flex w-64 flex-shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {section.color && (
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
          )}
          {renaming ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setRenaming(false); setNameInput(section.name) }
              }}
              className="text-sm font-medium text-neutral-700 bg-white border border-primary rounded px-1 outline-none w-full"
            />
          ) : (
            <span className="text-sm font-medium text-neutral-700 truncate">{section.name}</span>
          )}
          <span className="text-xs text-neutral-400 flex-shrink-0">{tasks.length}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setNameInput(section.name); setRenaming(true) }}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => {
                if (window.confirm(`Delete "${section.name}" and all its tasks?`)) {
                  deleteSection.mutate(section.id)
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="min-h-[60px] space-y-2 rounded-md bg-neutral-50 p-2">
          {tasks.length === 0 && (
            <p className="py-4 text-center text-xs text-neutral-400">No tasks</p>
          )}
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} projectId={projectId} />
          ))}
        </div>
      </SortableContext>
      <InlineTaskInput projectId={projectId} sectionId={section.id} variant="card" />
    </div>
  )
}

function AddSectionInput({ projectId, sections }: { projectId: string; sections: Section[] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateSection(projectId)

  function handleSubmit() {
    if (!name.trim() || create.isPending) return
    const lastPos = sections[sections.length - 1]?.position ?? 0
    create.mutate(
      { name: name.trim(), position: lastPos + 65536 },
      { onSuccess: () => { setName(''); setOpen(false) } },
    )
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="h-8 flex-shrink-0 self-start text-neutral-400"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add section
      </Button>
    )
  }

  return (
    <div className="w-64 flex-shrink-0">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setOpen(false); setName('') }
        }}
        placeholder="Section name"
        className="w-full rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 bg-white"
      />
      <div className="flex gap-1 mt-1.5">
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || create.isPending}>
          {create.isPending ? '…' : 'Add'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setName('') }}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sections = [] } = useSections(projectId!)
  const { data: tasks = [] } = useTasks(projectId!)
  const moveTask = useMoveTask(projectId!)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const sortedSections = [...sections].sort((a, b) => a.position - b.position)

  function tasksForSection(sectionId: string) {
    return tasks
      .filter((t) => t.section_id === sectionId && !t.parent_id)
      .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
      .filter((t) => filterStatus === 'all' || t.status === filterStatus)
      .sort((a, b) => a.position - b.position)
  }

  function handleDragStart(e: DragStartEvent) {
    const task = tasks.find((t) => t.id === e.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const task = tasks.find((t) => t.id === active.id)
    if (!task) return

    // Determine target section from the over id (section or task)
    const overTask = tasks.find((t) => t.id === over.id)
    const targetSectionId = overTask?.section_id ?? task.section_id

    // Simple fractional position: place at end of target section
    const sectionTasks = tasksForSection(targetSectionId ?? sections[0]?.id ?? '')
    const lastPos = sectionTasks[sectionTasks.length - 1]?.position ?? 0
    const newPos = lastPos + 65536

    moveTask.mutate({ taskId: task.id, sectionId: targetSectionId, position: newPos })
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="board" />
        <FilterBar
          priority={filterPriority}
          status={filterStatus}
          onPriority={setFilterPriority}
          onStatus={setFilterStatus}
        />
        <div className="flex-1 overflow-x-auto p-6">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full">
              {sortedSections.map((section) => (
                <KanbanColumn
                  key={section.id}
                  section={section}
                  tasks={tasksForSection(section.id)}
                  projectId={projectId!}
                  onOpenTask={setSelectedTask}
                />
              ))}
              <AddSectionInput projectId={projectId!} sections={sortedSections} />
            </div>
            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} isDragging projectId={projectId!} />}
            </DragOverlay>
          </DndContext>
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
