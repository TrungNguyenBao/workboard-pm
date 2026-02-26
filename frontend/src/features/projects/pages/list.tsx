import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckSquare, Circle, ChevronRight } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/shared/components/ui/badge'
import { cn, formatDate } from '@/shared/lib/utils'
import { useSections, useTasks, type Task, type Section } from '../hooks/use-project-tasks'
import { InlineTaskInput } from '../components/inline-task-input'
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer'
import { ProjectHeader } from '../components/project-header'
import api from '@/shared/lib/api'

const PRIORITY_BADGE: Record<string, string | undefined> = {
  high: 'danger',
  medium: 'warning',
  low: 'secondary',
  none: undefined,
}

function TaskRow({ task, projectId, onOpen }: { task: Task; projectId: string; onOpen: (t: Task) => void }) {
  const qc = useQueryClient()
  const toggle = useMutation({
    mutationFn: () =>
      api
        .patch(`/projects/${projectId}/tasks/${task.id}`, {
          status: task.status === 'completed' ? 'incomplete' : 'completed',
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  return (
    <div
      className={cn('flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-neutral-50 group cursor-pointer', task.status === 'completed' && 'opacity-60')}
      onClick={() => onOpen(task)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggle.mutate() }}
        className="flex-shrink-0 text-neutral-300 hover:text-primary transition-colors"
      >
        {task.status === 'completed' ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <span className={cn('flex-1 text-sm text-neutral-900', task.status === 'completed' && 'line-through')}>{task.title}</span>
      <div className="flex items-center gap-2 ml-auto">
        {PRIORITY_BADGE[task.priority] && (
          <Badge variant={PRIORITY_BADGE[task.priority]} className="text-xs capitalize">{task.priority}</Badge>
        )}
        {task.due_date && (
          <span className="text-xs text-neutral-400">{formatDate(task.due_date)}</span>
        )}
      </div>
    </div>
  )
}

function SectionGroup({ section, tasks, projectId, onOpenTask }: { section: Section; tasks: Task[]; projectId: string; onOpenTask: (t: Task) => void }) {
  const sectionTasks = tasks.filter((t) => t.section_id === section.id && !t.parent_id).sort((a, b) => a.position - b.position)
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 border-b border-border">
        <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-700">{section.name}</span>
        <span className="text-xs text-neutral-400">{sectionTasks.length}</span>
      </div>
      {sectionTasks.map((task) => (
        <TaskRow key={task.id} task={task} projectId={projectId} onOpen={onOpenTask} />
      ))}
      <InlineTaskInput projectId={projectId} sectionId={section.id} variant="row" />
    </div>
  )
}

export default function ListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sections = [] } = useSections(projectId!)
  const { data: tasks = [] } = useTasks(projectId!)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const sortedSections = [...sections].sort((a, b) => a.position - b.position)

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="list" />
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wide">
            <span className="w-4" />
            <span className="flex-1">Task</span>
            <span className="w-20 text-right">Priority</span>
            <span className="w-20 text-right">Due</span>
          </div>
          {sortedSections.map((section) => (
            <SectionGroup key={section.id} section={section} tasks={tasks} projectId={projectId!} onOpenTask={setSelectedTask} />
          ))}
        </div>
      </div>
      <TaskDetailDrawer
        task={selectedTask}
        projectId={projectId!}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
