import { isSameDay, isSameMonth, format } from 'date-fns'
import { cn } from '@/shared/lib/utils'
import type { Task } from '../hooks/use-project-tasks'

const PRIORITY_CHIP: Record<string, string> = {
  high: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  low: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  none: 'bg-primary/10 text-primary',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  days: Date[]
  currentMonth: Date
  tasksOnDay: (date: Date) => Task[]
  onOpen: (t: Task) => void
  onDragStart: (task: Task) => void
  onDrop: (date: Date) => void
}

export function CalendarMonthView({ days, currentMonth, tasksOnDay, onOpen, onDragStart, onDrop }: Props) {
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const tasks = tasksOnDay(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentMonth)
          return (
            <div
              key={day.toISOString()}
              className={cn('min-h-[100px] p-1.5 border-b border-r border-border', !isCurrentMonth && 'bg-muted/30')}
              onDragOver={handleDragOver}
              onDrop={() => onDrop(day)}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-primary text-white font-semibold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onClick={() => onOpen(task)}
                    onDragStart={() => onDragStart(task)}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-opacity',
                      task.status === 'completed'
                        ? 'bg-muted text-muted-foreground line-through'
                        : PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.none,
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {tasks.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{tasks.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
