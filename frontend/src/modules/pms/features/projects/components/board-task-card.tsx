import { CheckCircle2, Circle, Repeat } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import type { Task } from '../hooks/use-project-tasks'

type BadgeVariant = 'danger' | 'warning' | 'secondary'
const PRIORITY_COLORS: Record<string, BadgeVariant> = {
  high: 'danger',
  medium: 'warning',
  low: 'secondary',
  none: 'secondary',
}

interface BoardTaskCardProps {
  task: Task
  onOpen?: (t: Task) => void
  projectId: string
}

/** Draggable task card for board/kanban view */
export function BoardTaskCard({ task, onOpen, projectId }: BoardTaskCardProps) {
  const qc = useQueryClient()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const toggleComplete = useMutation({
    mutationFn: () =>
      api.patch(`/pms/projects/${projectId}/tasks/${task.id}`, {
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
        'group bg-card rounded-md border p-3 shadow-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
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
              ? 'line-through text-muted-foreground'
              : 'text-foreground hover:text-primary',
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
