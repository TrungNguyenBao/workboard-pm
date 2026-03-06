import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/shared/components/ui/badge'
import { cn, formatDate } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Props {
  task: Task
  workspaceId: string
  projectName: string | undefined
  onOpen: (t: Task) => void
}

export function MyTasksRow({ task, workspaceId, projectName, onOpen }: Props) {
  const qc = useQueryClient()
  const [completing, setCompleting] = useState(false)

  const toggle = useMutation({
    mutationFn: () =>
      api
        .patch(`/pms/projects/${task.project_id}/tasks/${task.id}`, { status: 'completed' })
        .then((r) => r.data),
    onMutate: () => { setCompleting(true) },
    onSuccess: () => {
      setTimeout(() => {
        qc.setQueryData<Task[]>(['my-tasks', workspaceId], (old) =>
          old?.filter((t) => t.id !== task.id) ?? []
        )
        qc.invalidateQueries({ queryKey: ['my-tasks'] })
      }, 600)
    },
    onError: () => setCompleting(false),
  })

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-muted transition-opacity cursor-pointer',
        completing && 'opacity-50',
      )}
      onClick={() => onOpen(task)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); if (!completing) toggle.mutate() }}
        className="flex-shrink-0 text-muted-foreground/50 hover:text-primary transition-colors"
      >
        {completing
          ? <CheckCircle2 className="h-4 w-4 text-primary animate-pulse" />
          : <Circle className="h-4 w-4" />
        }
      </button>
      <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {projectName && (
          <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 truncate max-w-[120px]">
            {projectName}
          </span>
        )}
        {task.priority !== 'none' && (
          <Badge
            variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'secondary'}
            className="capitalize text-xs"
          >
            {task.priority}
          </Badge>
        )}
        {task.due_date && (
          <span className={cn(
            'text-xs',
            new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-muted-foreground',
          )}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
