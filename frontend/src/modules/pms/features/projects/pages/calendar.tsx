import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { Button } from '@/shared/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/lib/utils'
import { useTasks, type Task } from '../hooks/use-project-tasks'
import { ProjectHeader } from '../components/project-header'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import api from '@/shared/lib/api'

const PRIORITY_CHIP: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  none: 'bg-primary/10 text-primary',
}

function CalendarDay({
  date,
  tasks,
  currentMonth,
  onOpen,
}: {
  date: Date
  tasks: Task[]
  currentMonth: Date
  onOpen: (t: Task) => void
}) {
  const isToday = isSameDay(date, new Date())
  const isCurrentMonth = isSameMonth(date, currentMonth)

  return (
    <div className={cn('min-h-[100px] p-1.5 border-b border-r border-border', !isCurrentMonth && 'bg-neutral-50')}>
      <span
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
          isToday ? 'bg-primary text-white font-semibold' : isCurrentMonth ? 'text-neutral-700' : 'text-neutral-300',
        )}
      >
        {format(date, 'd')}
      </span>
      <div className="mt-1 space-y-0.5">
        {tasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            onClick={() => onOpen(task)}
            className={cn(
              'truncate rounded px-1 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-opacity',
              task.status === 'completed'
                ? 'bg-neutral-100 text-neutral-400 line-through'
                : PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.none,
            )}
          >
            {task.title}
          </div>
        ))}
        {tasks.length > 3 && (
          <span className="text-xs text-neutral-400">+{tasks.length - 3} more</span>
        )}
      </div>
    </div>
  )
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: tasks = [] } = useTasks(projectId!)
  const [month, setMonth] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const start = startOfWeek(startOfMonth(month))
  const end = endOfWeek(endOfMonth(month))
  const days = eachDayOfInterval({ start, end })

  function tasksOnDay(date: Date) {
    return tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), date))
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader
          activeView="calendar"
          actions={
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-neutral-600 mr-1">{format(month, 'MMMM yyyy')}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addMonths(month, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMonth(new Date())}>Today</Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addMonths(month, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-neutral-50">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-neutral-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <CalendarDay
                  key={day.toISOString()}
                  date={day}
                  tasks={tasksOnDay(day)}
                  currentMonth={month}
                  onOpen={setSelectedTask}
                />
              ))}
            </div>
          </div>
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
