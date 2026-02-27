import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckSquare, Circle, ChevronRight, ArrowUpDown, Search, X, CheckCircle2, Repeat } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'
import { cn, formatDate } from '@/shared/lib/utils'
import { useSections, useTasks, type Task, type Section } from '../hooks/use-project-tasks'
import { InlineTaskInput } from '../components/inline-task-input'
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer'
import { ProjectHeader } from '../components/project-header'
import { FilterBar, type PriorityFilter, type StatusFilter } from '../components/filter-bar'
import api from '@/shared/lib/api'

type SortBy = 'position' | 'priority' | 'due_date'

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 }

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
      <span className={cn('flex-1 text-sm text-neutral-900 flex items-center gap-1', task.status === 'completed' && 'line-through')}>
        {task.title}
        {task.recurrence_rule && (
          <span className="text-neutral-400 flex-shrink-0" title={`Repeats ${task.recurrence_rule}`}>
            <Repeat className="h-3 w-3" />
          </span>
        )}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        {task.subtask_count > 0 && (
          <span className="text-xs text-neutral-400 flex items-center gap-0.5">
            <CheckCircle2 className="h-3 w-3" />
            {task.completed_subtask_count}/{task.subtask_count}
          </span>
        )}
        {PRIORITY_BADGE[task.priority] && (
          <Badge variant={PRIORITY_BADGE[task.priority]} className="text-xs capitalize">{task.priority}</Badge>
        )}
        {task.due_date && (
          <span className={cn(
            'text-xs',
            new Date(task.due_date) < new Date() && task.status !== 'completed'
              ? 'text-red-500 font-medium'
              : 'text-neutral-400',
          )}>
            {formatDate(task.due_date)}
          </span>
        )}
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

function SectionGroup({ section, tasks, projectId, onOpenTask, filterPriority, filterStatus, sortBy, searchText }: { section: Section; tasks: Task[]; projectId: string; onOpenTask: (t: Task) => void; filterPriority: PriorityFilter; filterStatus: StatusFilter; sortBy: SortBy; searchText: string }) {
  const [collapsed, setCollapsed] = useState(false)

  const sectionTasks = tasks
    .filter((t) => t.section_id === section.id && !t.parent_id)
    .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .filter((t) => !searchText || t.title.toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'priority') return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return a.position - b.position
    })

  return (
    <div>
      <button
        className="flex w-full items-center gap-2 px-4 py-2 bg-neutral-50 border-b border-border hover:bg-neutral-100 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <ChevronRight className={cn('h-3.5 w-3.5 text-neutral-400 transition-transform', !collapsed && 'rotate-90')} />
        <span className="text-sm font-medium text-neutral-700">{section.name}</span>
        <span className="text-xs text-neutral-400">{sectionTasks.length}</span>
      </button>
      {!collapsed && (
        <>
          {sectionTasks.length === 0 && (
            <p className="px-4 py-3 text-xs text-neutral-400">No tasks</p>
          )}
          {sectionTasks.map((task) => (
            <TaskRow key={task.id} task={task} projectId={projectId} onOpen={onOpenTask} />
          ))}
          <InlineTaskInput projectId={projectId} sectionId={section.id} variant="row" />
        </>
      )}
    </div>
  )
}

export default function ListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sections = [] } = useSections(projectId!)
  const { data: tasks = [] } = useTasks(projectId!)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('position')
  const [searchText, setSearchText] = useState('')

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const sortedSections = [...sections].sort((a, b) => a.position - b.position)

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="list" />
        <FilterBar
          priority={filterPriority}
          status={filterStatus}
          onPriority={setFilterPriority}
          onStatus={setFilterStatus}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wide">
            <span className="w-4" />
            <span className="flex-1">Task</span>
            <div className="relative flex items-center">
              <Search className="absolute left-2 h-3 w-3 text-neutral-400 pointer-events-none" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search tasks…"
                className="pl-6 pr-6 py-0.5 text-xs rounded border border-transparent hover:border-border focus:border-border focus:ring-1 focus:ring-primary/40 outline-none bg-transparent normal-case font-normal text-neutral-700 placeholder:text-neutral-400 w-32 focus:w-44 transition-all"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-1 text-neutral-400 hover:text-neutral-700">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <span className="w-20 text-right">Priority</span>
            <span className="w-20 text-right">Due</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="ml-1 text-neutral-400 hover:text-neutral-700" title="Sort by">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {([['position', 'Manual order'], ['priority', 'Priority'], ['due_date', 'Due date']] as [SortBy, string][]).map(([val, label]) => (
                  <DropdownMenuItem key={val} onClick={() => setSortBy(val)} className={cn(sortBy === val && 'font-medium text-primary')}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {sortedSections.map((section) => (
            <SectionGroup
              key={section.id}
              section={section}
              tasks={tasks}
              projectId={projectId!}
              onOpenTask={setSelectedTask}
              filterPriority={filterPriority}
              filterStatus={filterStatus}
              sortBy={sortBy}
              searchText={searchText}
            />
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
