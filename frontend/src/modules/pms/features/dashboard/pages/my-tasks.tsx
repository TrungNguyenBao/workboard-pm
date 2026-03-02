import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CheckSquare, Circle } from 'lucide-react'
import { Header } from '@/features/auth/components/header'
import { Badge } from '@/shared/components/ui/badge'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { cn, formatDate } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Project { id: string; name: string }

function useMyTasks() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  return useQuery<Task[]>({
    queryKey: ['my-tasks', activeWorkspaceId],
    queryFn: () =>
      api.get(`/workspaces/${activeWorkspaceId}/tasks/my`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })
}

function useWorkspaceProjects() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  return useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () =>
      api.get(`/pms/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
    staleTime: 60_000,
  })
}

function bucketTasks(tasks: Task[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)
  const weekEnd = new Date(todayStart.getTime() + 7 * 86_400_000)

  const overdue: Task[] = []
  const today: Task[] = []
  const upcoming: Task[] = []
  const later: Task[] = []

  for (const t of tasks) {
    if (!t.due_date) { later.push(t); continue }
    const d = new Date(t.due_date)
    if (d < todayStart) overdue.push(t)
    else if (d < todayEnd) today.push(t)
    else if (d < weekEnd) upcoming.push(t)
    else later.push(t)
  }
  return { overdue, today, upcoming, later }
}

function TaskRow({
  task,
  workspaceId,
  projectName,
  onOpen,
}: {
  task: Task
  workspaceId: string
  projectName: string | undefined
  onOpen: (t: Task) => void
}) {
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
        'flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-neutral-50 transition-opacity cursor-pointer',
        completing && 'opacity-50',
      )}
      onClick={() => onOpen(task)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); !completing && toggle.mutate() }}
        className="flex-shrink-0 text-neutral-300 hover:text-primary transition-colors"
      >
        {completing
          ? <CheckCircle2 className="h-4 w-4 text-primary animate-pulse" />
          : <Circle className="h-4 w-4" />
        }
      </button>
      <span className="flex-1 text-sm text-neutral-900 truncate">{task.title}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {projectName && (
          <span className="text-xs text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5 truncate max-w-[120px]">
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
            new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-neutral-400',
          )}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}

function BucketSection({
  label,
  tasks,
  workspaceId,
  projectMap,
  onOpen,
  accent,
}: {
  label: string
  tasks: Task[]
  workspaceId: string
  projectMap: Map<string, string>
  onOpen: (t: Task) => void
  accent?: 'red' | 'amber' | 'neutral'
}) {
  if (tasks.length === 0) return null
  const headerCls = accent === 'red'
    ? 'bg-red-50 border-red-100'
    : accent === 'amber'
    ? 'bg-amber-50 border-amber-100'
    : 'bg-neutral-50 border-border'
  const labelCls = accent === 'red'
    ? 'text-red-600'
    : accent === 'amber'
    ? 'text-amber-600'
    : 'text-neutral-500'
  const badgeVariant = accent === 'red' ? 'danger' : accent === 'amber' ? 'warning' : 'secondary'

  return (
    <section className="mb-6">
      <div className={cn('flex items-center gap-2 px-4 py-2 border-b', headerCls)}>
        <span className={cn('text-xs font-semibold uppercase tracking-wide', labelCls)}>{label}</span>
        <Badge variant={badgeVariant}>{tasks.length}</Badge>
      </div>
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          workspaceId={workspaceId}
          projectName={projectMap.get(t.project_id)}
          onOpen={onOpen}
        />
      ))}
    </section>
  )
}

export default function MyTasksPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const { data: tasks = [], isLoading } = useMyTasks()
  const { data: projects = [] } = useWorkspaceProjects()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const projectMap = new Map(projects.map((p) => [p.id, p.name]))
  const { overdue, today, upcoming, later } = bucketTasks(tasks)

  return (
    <>
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

          <BucketSection label="Overdue" tasks={overdue} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} accent="red" />
          <BucketSection label="Today" tasks={today} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} accent="amber" />
          <BucketSection label="Upcoming" tasks={upcoming} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} />
          <BucketSection label="Later" tasks={later} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} />
        </div>
      </div>
      <TaskDetailDrawer
        task={selectedTask}
        projectId={selectedTask?.project_id ?? ''}
        workspaceId={activeWorkspaceId ?? undefined}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
