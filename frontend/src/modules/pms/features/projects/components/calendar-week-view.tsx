import { isSameDay, format } from 'date-fns'
import { cn } from '@/shared/lib/utils'
import type { Task } from '../hooks/use-project-tasks'

const PRIORITY_CHIP: Record<string, string> = {
  high: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  low: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  none: 'bg-primary/10 text-primary',
}

interface Props {
  weekDays: Date[]
  tasksOnDay: (date: Date) => Task[]
  onOpen: (t: Task) => void
  onDragStart: (task: Task) => void
  onDrop: (date: Date) => void
}

export function CalendarWeekView({ weekDays, tasksOnDay, onOpen, onDragStart, onDrop }: Props) {
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date())
          return (
            <div key={day.toISOString()} className="py-2 text-center">
              <div className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</div>
              <div
                className={cn(
                  'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                  isToday ? 'bg-primary text-white' : 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[480px]">
        {weekDays.map((day) => {
          const tasks = tasksOnDay(day)
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              className={cn('border-r border-border p-1.5 space-y-0.5', isToday && 'bg-primary/5')}
              onDragOver={handleDragOver}
              onDrop={() => onDrop(day)}
            >
              {tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  data-task-id={task.id}
                  onClick={() => onOpen(task)}
                  onDragStart={() => onDragStart(task)}
                  className={cn(
                    'truncate rounded px-1.5 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity',
                    task.status === 'completed'
                      ? 'bg-muted text-muted-foreground line-through'
                      : PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.none,
                  )}
                >
                  {task.title}
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="h-full min-h-[60px]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
