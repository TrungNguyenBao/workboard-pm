import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { MyTasksBucket } from '../components/my-tasks-bucket'
import api from '@/shared/lib/api'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Project { id: string; name: string }

function useMyTasks() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  return useQuery<Task[]>({
    queryKey: ['my-tasks', activeWorkspaceId],
    queryFn: () => api.get(`/workspaces/${activeWorkspaceId}/tasks/my`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })
}

function useWorkspaceProjects() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  return useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => api.get(`/pms/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
    staleTime: 60_000,
  })
}

function bucketTasks(tasks: Task[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)
  const weekEnd = new Date(todayStart.getTime() + 7 * 86_400_000)
  const overdue: Task[] = [], today: Task[] = [], upcoming: Task[] = [], later: Task[] = []
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

export default function MyTasksPage() {
  const { t } = useTranslation('pms')
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const { data: tasks = [], isLoading } = useMyTasks()
  const { data: projects = [] } = useWorkspaceProjects()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const projectMap = new Map(projects.map((p) => [p.id, p.name]))
  const { overdue, today, upcoming, later } = bucketTasks(tasks)

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto pt-6">
          {isLoading && (
            <div className="space-y-px px-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
                  <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 flex-1 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && tasks.length === 0 && (
            <EmptyState
              icon={<CheckSquare className="h-10 w-10" />}
              title={t('myTasks.allCaughtUp')}
              description={t('myTasks.noTasksDescription', 'No tasks assigned to you right now.')}
            />
          )}

          <MyTasksBucket label={t('myTasks.overdue')} tasks={overdue} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} accent="red" />
          <MyTasksBucket label={t('myTasks.today')} tasks={today} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} accent="amber" />
          <MyTasksBucket label={t('myTasks.upcoming')} tasks={upcoming} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} />
          <MyTasksBucket label={t('myTasks.later')} tasks={later} workspaceId={activeWorkspaceId!} projectMap={projectMap} onOpen={setSelectedTask} />
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
