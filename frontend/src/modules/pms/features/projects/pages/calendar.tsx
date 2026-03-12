import { useParams } from 'react-router-dom'
import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays, addMonths, addWeeks,
  eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, startOfMonth, startOfWeek,
} from 'date-fns'
import { Button } from '@/shared/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/lib/utils'
import { useTasks, useUpdateTask, type Task } from '../hooks/use-project-tasks'
import { ProjectHeader } from '../components/project-header'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { CalendarMonthView } from '../components/calendar-month-view'
import { CalendarWeekView } from '../components/calendar-week-view'
import { CalendarDayView } from '../components/calendar-day-view'
import api from '@/shared/lib/api'

type CalendarView = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: tasks = [] } = useTasks(projectId!)
  const updateTask = useUpdateTask(projectId!)
  const [view, setView] = useState<CalendarView>('month')
  const [current, setCurrent] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const draggedTask = useRef<Task | null>(null)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  function tasksOnDay(date: Date) {
    return tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), date))
  }

  function handleDrop(targetDate: Date) {
    const task = draggedTask.current
    if (!task) return
    const newDueDate = targetDate.toISOString()
    if (!isSameDay(new Date(task.due_date ?? ''), targetDate)) {
      updateTask.mutate({ taskId: task.id, due_date: newDueDate })
    }
    draggedTask.current = null
  }

  // Navigation helpers per view
  function navigatePrev() {
    if (view === 'month') setCurrent((d) => addMonths(d, -1))
    else if (view === 'week') setCurrent((d) => addWeeks(d, -1))
    else setCurrent((d) => addDays(d, -1))
  }
  function navigateNext() {
    if (view === 'month') setCurrent((d) => addMonths(d, 1))
    else if (view === 'week') setCurrent((d) => addWeeks(d, 1))
    else setCurrent((d) => addDays(d, 1))
  }

  // Date ranges per view
  const monthStart = startOfMonth(current)
  const monthDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(current)) })
  const weekDays = eachDayOfInterval({ start: startOfWeek(current), end: endOfWeek(current) })

  function headerLabel() {
    if (view === 'month') return format(current, 'MMMM yyyy')
    if (view === 'week') return `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
    return format(current, 'EEEE, MMM d, yyyy')
  }

  const views: CalendarView[] = ['month', 'week', 'day']

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader
          activeView="calendar"
          actions={
            <div className="flex items-center gap-1">
              {/* View toggle */}
              <div className="flex rounded border border-border overflow-hidden mr-2">
                {views.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                      view === v ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {/* Navigation */}
              <span className="text-xs font-medium text-muted-foreground mr-1">{headerLabel()}</span>
              <Button variant="ghost" size="icon-sm" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())}>Today</Button>
              <Button variant="ghost" size="icon-sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />
        <div className="flex-1 overflow-auto p-4">
          {view === 'month' && (
            <CalendarMonthView
              days={monthDays}
              currentMonth={current}
              tasksOnDay={tasksOnDay}
              onOpen={setSelectedTask}
              onDragStart={(t) => { draggedTask.current = t }}
              onDrop={handleDrop}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              weekDays={weekDays}
              tasksOnDay={tasksOnDay}
              onOpen={setSelectedTask}
              onDragStart={(t) => { draggedTask.current = t }}
              onDrop={handleDrop}
            />
          )}
          {view === 'day' && (
            <CalendarDayView
              day={current}
              tasks={tasksOnDay(current)}
              onOpen={setSelectedTask}
              onDragStart={(t) => { draggedTask.current = t }}
              onDrop={handleDrop}
            />
          )}
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
