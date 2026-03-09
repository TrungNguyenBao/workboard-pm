import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { ProjectHeader } from '../components/project-header'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { useBacklogTasks } from '../hooks/use-backlog-tasks'
import type { Task } from '../hooks/use-project-tasks'
import api from '@/shared/lib/api'

const TYPE_STYLES: Record<string, string> = {
  bug: 'bg-red-100 text-red-600',
  story: 'bg-blue-100 text-blue-600',
  epic: 'bg-purple-100 text-purple-600',
  task: 'bg-neutral-100 text-neutral-600',
}

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: tasks = [], isLoading } = useBacklogTasks(projectId!)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="backlog" />
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-3">
            <span className="flex-1">Task</span>
            <span className="w-16 text-center">Type</span>
            <span className="w-12 text-center">Points</span>
            <span className="w-20 text-right">Priority</span>
          </div>

          {isLoading && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          )}

          {!isLoading && tasks.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tasks in backlog. Assign tasks to a sprint from the board view.
            </p>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-muted/50 cursor-pointer"
            >
              <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>
              <Badge
                variant="secondary"
                className={cn('text-[10px] w-14 justify-center', TYPE_STYLES[task.task_type] ?? TYPE_STYLES.task)}
              >
                {task.task_type ?? 'task'}
              </Badge>
              <span className="w-12 text-center text-xs text-muted-foreground">
                {task.story_points ?? '--'}
              </span>
              <span className="w-20 text-right text-xs capitalize text-muted-foreground">
                {task.priority !== 'none' ? task.priority : ''}
              </span>
            </div>
          ))}
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
