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
  day: Date
  tasks: Task[]
  onOpen: (t: Task) => void
  onDragStart: (task: Task) => void
  onDrop: (date: Date) => void
}

export function CalendarDayView({ day, tasks, onOpen, onDragStart, onDrop }: Props) {
  const isToday = isSameDay(day, new Date())

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Day header */}
      <div className={cn('border-b border-border px-4 py-3 bg-muted/30', isToday && 'bg-primary/5')}>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold', isToday ? 'text-primary' : 'text-foreground')}>
            {format(day, 'd')}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {format(day, 'EEEE, MMMM yyyy')}
          </span>
          {isToday && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Task list drop zone */}
      <div
        className="min-h-[480px] p-3 space-y-1.5"
        onDragOver={handleDragOver}
        onDrop={() => onDrop(day)}
      >
        {tasks.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No tasks due on this day
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              draggable
              data-task-id={task.id}
              onClick={() => onOpen(task)}
              onDragStart={() => onDragStart(task)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:opacity-80 transition-opacity',
                task.status === 'completed'
                  ? 'bg-muted text-muted-foreground line-through'
                  : PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.none,
              )}
            >
              <span className="flex-1 truncate font-medium">{task.title}</span>
              {task.assignee_name && (
                <span className="text-xs opacity-70 shrink-0">{task.assignee_name}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
