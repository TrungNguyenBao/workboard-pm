import { useRef } from 'react'
import { differenceInDays, addDays, format } from 'date-fns'
import { cn } from '@/shared/lib/utils'
import type { Task } from '../hooks/use-project-tasks'

const PRIORITY_BAR: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
  none: 'bg-primary',
}

interface Props {
  task: Task
  timelineStart: Date
  dayWidth: number
  onClickTask: (task: Task) => void
  onDatesChange: (taskId: string, dates: { start_date?: string | null; due_date?: string | null }) => void
}

export function TimelineTaskBar({ task, timelineStart, dayWidth, onClickTask, onDatesChange }: Props) {
  const dragRef = useRef<{
    edge: 'left' | 'right'
    startX: number
    origStart: string | null
    origDue: string | null
  } | null>(null)

  const startDate = task.start_date ? new Date(task.start_date) : null
  const dueDate = task.due_date ? new Date(task.due_date) : null

  // Tasks with only due_date: render as a dot/diamond marker
  if (!startDate && dueDate) {
    const left = differenceInDays(dueDate, timelineStart) * dayWidth
    return (
      <div
        title={`${task.title}\n${format(dueDate, 'MMM d')}`}
        onClick={() => onClickTask(task)}
        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 cursor-pointer bg-muted-foreground border border-white hover:scale-125 transition-transform"
        style={{ left: left + dayWidth / 2 - 6 }}
      />
    )
  }

  if (!startDate || !dueDate) return null

  const left = differenceInDays(startDate, timelineStart) * dayWidth
  const duration = Math.max(1, differenceInDays(dueDate, startDate))
  const width = duration * dayWidth

  function handleDragStart(edge: 'left' | 'right', e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { edge, startX: e.clientX, origStart: task.start_date, origDue: task.due_date }

    function onUp(ev: MouseEvent) {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const daysDelta = Math.round(dx / dayWidth)
      if (daysDelta !== 0) {
        const { edge: e2, origStart, origDue } = dragRef.current
        if (e2 === 'left' && origStart) {
          const newStart = addDays(new Date(origStart), daysDelta)
          const dueD = origDue ? new Date(origDue) : null
          if (!dueD || newStart <= dueD) {
            onDatesChange(task.id, { start_date: newStart.toISOString() })
          }
        } else if (e2 === 'right' && origDue) {
          const newDue = addDays(new Date(origDue), daysDelta)
          const startD = origStart ? new Date(origStart) : null
          if (!startD || newDue >= startD) {
            onDatesChange(task.id, { due_date: newDue.toISOString() })
          }
        }
      }
      dragRef.current = null
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      title={`${task.title}\n${format(startDate, 'MMM d')} → ${format(dueDate, 'MMM d')}`}
      onClick={() => onClickTask(task)}
      className={cn(
        'absolute top-1 bottom-1 rounded cursor-pointer group flex items-center hover:brightness-90 transition-all overflow-hidden',
        task.status === 'completed'
          ? 'bg-muted-foreground/30 opacity-60'
          : (PRIORITY_BAR[task.priority] ?? PRIORITY_BAR.none),
      )}
      style={{ left, width: Math.max(width, dayWidth) }}
    >
      {/* Left drag handle — resize start_date */}
      <div
        onMouseDown={(e) => handleDragStart('left', e)}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/20 rounded-l"
      />
      <span className={cn(
        'px-1.5 truncate text-xs text-white font-medium select-none',
        task.status === 'completed' && 'line-through text-white/60',
      )}>
        {task.title}
      </span>
      {/* Right drag handle — resize due_date */}
      <div
        onMouseDown={(e) => handleDragStart('right', e)}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/20 rounded-r"
      />
    </div>
  )
}
