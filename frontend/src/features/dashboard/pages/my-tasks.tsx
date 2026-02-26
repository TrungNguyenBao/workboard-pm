import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Circle } from 'lucide-react'
import { Header } from '@/features/auth/components/header'
import { Badge } from '@/shared/components/ui/badge'
import { cn, formatDate } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type { Task } from '@/features/projects/hooks/use-project-tasks'

// My tasks = all incomplete tasks assigned to the current user across the workspace
function useMyTasks() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  return useQuery<Task[]>({
    queryKey: ['my-tasks', activeWorkspaceId],
    queryFn: () =>
      api.get(`/workspaces/${activeWorkspaceId}/tasks/my`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })
}

function TaskRow({ task }: { task: Task }) {
  const qc = useQueryClient()
  const toggle = useMutation({
    mutationFn: () =>
      api
        .patch(`/projects/${task.project_id}/tasks/${task.id}`, { status: 'completed' })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tasks'] }),
  })

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-neutral-50 group">
      <button
        onClick={() => toggle.mutate()}
        className="flex-shrink-0 text-neutral-300 hover:text-primary transition-colors"
      >
        <Circle className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm text-neutral-900">{task.title}</span>
      <div className="flex items-center gap-2">
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
            new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-neutral-400',
          )}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function MyTasksPage() {
  const { data: tasks = [], isLoading } = useMyTasks()

  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date())
  const upcoming = tasks.filter((t) => !t.due_date || new Date(t.due_date) >= new Date())

  return (
    <div className="flex flex-col h-full">
      <Header title="My Tasks" />
      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto pt-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-neutral-400">Loading…</div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <CheckSquare className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">All caught up!</p>
          </div>
        )}

        {overdue.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Overdue</span>
              <Badge variant="danger">{overdue.length}</Badge>
            </div>
            {overdue.map((t) => <TaskRow key={t.id} task={t} />)}
          </section>
        )}

        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 border-b border-border">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Upcoming</span>
              <Badge variant="secondary">{upcoming.length}</Badge>
            </div>
            {upcoming.map((t) => <TaskRow key={t.id} task={t} />)}
          </section>
        )}
      </div>
    </div>
  )
}
