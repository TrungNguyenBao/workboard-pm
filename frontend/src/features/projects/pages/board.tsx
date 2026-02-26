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
import { Plus, MoreHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useSections, useTasks, useMoveTask, useCreateSection, type Task, type Section } from '../hooks/use-project-tasks'
import { InlineTaskInput } from '../components/inline-task-input'
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer'
import { ProjectHeader } from '../components/project-header'
import api from '@/shared/lib/api'

type BadgeVariant = 'danger' | 'warning' | 'secondary'
const PRIORITY_COLORS: Record<string, BadgeVariant> = {
  high: 'danger',
  medium: 'warning',
  low: 'secondary',
  none: 'secondary',
}

function TaskCard({ task, isDragging, onOpen }: { task: Task; isDragging?: boolean; onOpen?: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-white rounded-md border border-border p-3 shadow-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p
        className="text-sm text-neutral-900 leading-snug hover:text-primary cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onOpen?.(task) }}
      >
        {task.title}
      </p>
      <div className="flex items-center gap-2 mt-2">
        {task.priority !== 'none' && (
          <Badge variant={PRIORITY_COLORS[task.priority]} className="text-xs">
            {task.priority}
          </Badge>
        )}
        {task.due_date && (
          <span className="text-xs text-neutral-400">
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ section, tasks, projectId, onOpenTask }: { section: Section; tasks: Task[]; projectId: string; onOpenTask: (t: Task) => void }) {
  const taskIds = tasks.map((t) => t.id)
  return (
    <div className="flex w-64 flex-shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {section.color && (
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: section.color }} />
          )}
          <span className="text-sm font-medium text-neutral-700">{section.name}</span>
          <span className="text-xs text-neutral-400">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="min-h-[60px] space-y-2 rounded-md bg-neutral-50 p-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const sortedSections = [...sections].sort((a, b) => a.position - b.position)

  function tasksForSection(sectionId: string) {
    return tasks.filter((t) => t.section_id === sectionId && !t.parent_id).sort((a, b) => a.position - b.position)
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
              {activeTask && <TaskCard task={activeTask} isDragging />}
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
