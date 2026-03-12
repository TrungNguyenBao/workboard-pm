import { differenceInDays } from 'date-fns'
import type { Task } from '../hooks/use-project-tasks'

const ROW_HEIGHT = 36
const HEADER_HEIGHT = 32 // matches h-8 timeline header

interface Props {
  tasks: Task[]
  /** Ordered list of visible task rows (same order as rendered) */
  visibleRows: Task[]
  timelineStart: Date
  dayWidth: number
  /** Left offset of the bar area (name column width) */
  nameColWidth: number
}

interface Arrow {
  x1: number
  y1: number
  x2: number
  y2: number
}

function barEdges(task: Task, timelineStart: Date, dayWidth: number) {
  const startDate = task.start_date ? new Date(task.start_date) : null
  const dueDate = task.due_date ? new Date(task.due_date) : null
  if (!dueDate) return null
  const effectiveStart = startDate ?? dueDate
  const left = differenceInDays(effectiveStart, timelineStart) * dayWidth
  const duration = startDate ? Math.max(1, differenceInDays(dueDate, startDate)) : 0
  const right = left + Math.max(duration * dayWidth, dayWidth)
  return { left, right }
}

export function TimelineDependencyArrows({ tasks, visibleRows, timelineStart, dayWidth, nameColWidth }: Props) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const rowIndex = new Map(visibleRows.map((t, i) => [t.id, i]))

  const arrows: Arrow[] = []

  for (const task of tasks) {
    if (!task.blocking_task_ids?.length) continue
    const fromEdges = barEdges(task, timelineStart, dayWidth)
    if (!fromEdges) continue
    const fromRow = rowIndex.get(task.id)
    if (fromRow === undefined) continue

    for (const blockedId of task.blocking_task_ids) {
      const blockedTask = taskMap.get(blockedId)
      if (!blockedTask) continue
      const toEdges = barEdges(blockedTask, timelineStart, dayWidth)
      if (!toEdges) continue
      const toRow = rowIndex.get(blockedId)
      if (toRow === undefined) continue

      arrows.push({
        x1: fromEdges.right,
        y1: HEADER_HEIGHT + (fromRow + 0.5) * ROW_HEIGHT,
        x2: toEdges.left,
        y2: HEADER_HEIGHT + (toRow + 0.5) * ROW_HEIGHT,
      })
    }
  }

  if (arrows.length === 0) return null

  const datedTasks = tasks.filter((t) => t.due_date)
  const maxDueMs = datedTasks.length > 0
    ? Math.max(...datedTasks.map((t) => new Date(t.due_date!).getTime()))
    : timelineStart.getTime()
  const totalWidth = nameColWidth + differenceInDays(new Date(maxDueMs), timelineStart) * dayWidth + dayWidth * 4
  const totalHeight = HEADER_HEIGHT + visibleRows.length * ROW_HEIGHT

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id="dep-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="rgb(var(--color-primary) / 0.7)" />
        </marker>
      </defs>
      {arrows.map((a, i) => {
        const cx1 = a.x1 + nameColWidth + 8
        const cy1 = a.y1
        const cx2 = a.x2 + nameColWidth - 8
        const cy2 = a.y2
        // Bezier control points
        const midX = (cx1 + cx2) / 2
        return (
          <path
            key={i}
            d={`M ${cx1} ${cy1} C ${midX} ${cy1}, ${midX} ${cy2}, ${cx2} ${cy2}`}
            fill="none"
            stroke="rgb(var(--color-primary) / 0.5)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#dep-arrow)"
          />
        )
      })}
    </svg>
  )
}
