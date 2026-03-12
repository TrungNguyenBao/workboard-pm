import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Plus, Square } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Props {
  subtasks: Task[]
  projectId: string
  parentTaskId: string
  newSubtask: string
  subtaskRef: React.RefObject<HTMLInputElement>
  isPending: boolean
  onNewSubtaskChange: (val: string) => void
  onCreateSubtask: () => void
}

export function SubtasksSection({
  subtasks,
  projectId,
  parentTaskId,
  newSubtask,
  subtaskRef,
  isPending,
  onNewSubtaskChange,
  onCreateSubtask,
}: Props) {
  const qc = useQueryClient()

  const toggleSubtask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/pms/projects/${projectId}/tasks/${id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtasks', parentTaskId] })
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })

  const total = subtasks.length
  const completed = subtasks.filter((s) => s.status === 'completed').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      {/* Header with count and progress */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          Subtasks{total > 0 ? ` ${completed}/${total}` : ''}
        </p>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">{pct}%</span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Subtask list with indent */}
      {total > 0 && (
        <div className="space-y-1 mb-3 pl-2 border-l-2 border-border">
          {subtasks.map((sub) => {
            const done = sub.status === 'completed'
            return (
              <button
                key={sub.id}
                onClick={() =>
                  toggleSubtask.mutate({
                    id: sub.id,
                    status: done ? 'incomplete' : 'completed',
                  })
                }
                className="flex items-center gap-2 w-full text-left group hover:bg-muted/40 rounded px-1 py-0.5 transition-colors"
              >
                {done ? (
                  <CheckSquare className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                ) : (
                  <Square className="h-3.5 w-3.5 flex-shrink-0 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
                )}
                <span
                  className={cn(
                    'text-sm flex-1 truncate',
                    done && 'line-through text-neutral-400',
                  )}
                >
                  {sub.title}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Add subtask input */}
      <div className="flex items-center gap-2">
        <input
          ref={subtaskRef}
          value={newSubtask}
          onChange={(e) => onNewSubtaskChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newSubtask.trim()) onCreateSubtask()
            if (e.key === 'Escape') onNewSubtaskChange('')
          }}
          placeholder="Add subtask…"
          className="flex-1 text-sm bg-muted/50 border border-border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/40"
        />
        {newSubtask.trim() && (
          <button
            onClick={onCreateSubtask}
            disabled={isPending}
            className="p-1 text-primary hover:text-primary/80 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
