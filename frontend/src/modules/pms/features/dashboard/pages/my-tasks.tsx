import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { EmptyState } from '@/shared/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { MyTasksBucket } from '../components/my-tasks-bucket'
import api from '@/shared/lib/api'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Project { id: string; name: string }

type SortBy = 'due_date' | 'priority' | 'created_at'
type PriorityFilter = 'all' | 'high' | 'medium' | 'low'
type StatusFilter = 'all' | 'incomplete' | 'completed'

function useMyTasks(
  workspaceId: string | null,
  priority: PriorityFilter,
  status: StatusFilter,
  sortBy: SortBy,
) {
  const params = new URLSearchParams({ sort_by: sortBy })
  if (priority !== 'all') params.set('priority', priority)
  if (status !== 'all') params.set('status', status)
  return useQuery<Task[]>({
    queryKey: ['my-tasks', workspaceId, priority, status, sortBy],
    queryFn: () =>
      api
        .get(`/pms/workspaces/${workspaceId}/my-tasks?${params.toString()}`)
        .then((r) => r.data),
    enabled: !!workspaceId,
  })
}

function useWorkspaceProjects(workspaceId: string | null) {
  return useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: () =>
      api.get(`/pms/workspaces/${workspaceId}/projects`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })
}

function groupByProject(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const bucket = map.get(t.project_id) ?? []
    bucket.push(t)
    map.set(t.project_id, bucket)
  }
  return map
}

export default function MyTasksPage() {
  const { t } = useTranslation('pms')
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('due_date')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useMyTasks(activeWorkspaceId, priority, status, sortBy)
  const { data: projects = [] } = useWorkspaceProjects(activeWorkspaceId)

  const projectMap = new Map(projects.map((p) => [p.id, p.name]))
  const grouped = groupByProject(tasks)

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto pt-6">
          <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
            <Select value={priority} onValueChange={(v) => setPriority(v as PriorityFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created_at">Created date</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {Array.from(grouped.entries()).map(([projectId, projectTasks]) => (
            <MyTasksBucket
              key={projectId}
              label={projectMap.get(projectId) ?? 'Unknown project'}
              tasks={projectTasks}
              workspaceId={activeWorkspaceId!}
              projectMap={projectMap}
              onOpen={setSelectedTask}
            />
          ))}
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
