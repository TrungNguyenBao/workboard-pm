import { useState } from 'react'
import { ChevronRight, Play, CheckCircle2, Pencil } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { BacklogTaskRow } from './backlog-task-row'
import type { Task } from '../hooks/use-project-tasks'
import type { Sprint } from '../hooks/use-sprints'

interface Props {
  /** null = backlog section */
  sprint: Sprint | null
  tasks: Task[]
  allSprints: Sprint[]
  onOpenTask: (task: Task) => void
  onMoveTo: (taskId: string, sprintId: string | null) => void
  onStartSprint?: (sprintId: string) => void
  onCompleteSprint?: (sprintId: string) => void
  onEditSprint?: (sprint: Sprint) => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
}

export function BacklogSprintSection({
  sprint,
  tasks,
  allSprints,
  onOpenTask,
  onMoveTo,
  onStartSprint,
  onCompleteSprint,
  onEditSprint,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const droppableId = sprint ? `sprint-${sprint.id}` : 'sprint-backlog'

  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  const totalPoints = tasks.reduce((s, t) => s + (t.story_points ?? 0), 0)
  const label = sprint ? sprint.name : 'Backlog'

  return (
    <div className={cn('border border-border rounded-lg', isOver && 'ring-2 ring-primary/40')}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer select-none"
        onClick={() => setCollapsed((p) => !p)}
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-90')} />
        <span className="text-sm font-semibold text-foreground">{label}</span>

        {sprint && (
          <Badge variant="secondary" className={cn('text-[10px]', STATUS_COLORS[sprint.status])}>
            {sprint.status}
          </Badge>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {totalPoints > 0 && ` | ${totalPoints} pts`}
        </span>

        {sprint?.goal && (
          <span className="text-xs text-muted-foreground italic truncate max-w-48" title={sprint.goal}>
            — {sprint.goal}
          </span>
        )}

        {/* Sprint actions */}
        <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
          {sprint?.status === 'planning' && onStartSprint && (
            <Button size="icon-sm" variant="ghost" title="Start sprint" onClick={() => onStartSprint(sprint.id)}>
              <Play className="h-3.5 w-3.5 text-green-600" />
            </Button>
          )}
          {sprint?.status === 'active' && onCompleteSprint && (
            <Button size="icon-sm" variant="ghost" title="Complete sprint" onClick={() => onCompleteSprint(sprint.id)}>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
          {sprint && onEditSprint && (
            <Button size="icon-sm" variant="ghost" title="Edit sprint" onClick={() => onEditSprint(sprint)}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Task list */}
      {!collapsed && (
        <div ref={setNodeRef} className="min-h-[32px]">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <BacklogTaskRow
                key={task.id}
                task={task}
                sprints={allSprints}
                onOpenTask={onOpenTask}
                onMoveTo={onMoveTo}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {sprint ? 'Drag tasks here to add to this sprint' : 'No tasks in backlog'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
