import { useState, useMemo } from 'react'
import { differenceInDays, eachDayOfInterval, format, isToday, isSameMonth } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Task, Section } from '../hooks/use-project-tasks'
import { TimelineTaskBar } from './timeline-task-bar'

const ROW_HEIGHT = 36 // px

interface Props {
  tasks: Task[]
  sections: Section[]
  dayWidth: number
  timelineStart: Date
  timelineEnd: Date
  onClickTask: (task: Task) => void
  onDatesChange: (taskId: string, dates: { start_date?: string | null; due_date?: string | null }) => void
}

export function TimelineGrid({ tasks, sections, dayWidth, timelineStart, timelineEnd, onClickTask, onDatesChange }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const days = useMemo(
    () => eachDayOfInterval({ start: timelineStart, end: timelineEnd }),
    [timelineStart, timelineEnd],
  )
  const totalWidth = days.length * dayWidth
  const todayOffset = differenceInDays(new Date(), timelineStart)

  // Group root tasks by section_id (null = no section)
  const tasksBySection = useMemo(() => {
    const map = new Map<string | null, Task[]>()
    for (const task of tasks.filter((t) => !t.parent_id)) {
      const key = task.section_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  function toggleSection(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function renderTaskRow(task: Task) {
    return (
      <div key={task.id} className="flex border-b border-border/50" style={{ height: ROW_HEIGHT }}>
        {/* Name cell — sticky on horizontal scroll */}
        <div className="w-48 flex-shrink-0 sticky left-0 z-10 bg-background border-r border-border px-3 flex items-center">
          <span className="truncate text-xs text-foreground">{task.title}</span>
        </div>
        {/* Bar cell */}
        <div className="relative flex-shrink-0" style={{ width: totalWidth, height: ROW_HEIGHT }}>
          <TimelineTaskBar
            task={task}
            timelineStart={timelineStart}
            dayWidth={dayWidth}
            onClickTask={onClickTask}
            onDatesChange={onDatesChange}
          />
        </div>
      </div>
    )
  }

  function renderSectionGroup(sectionId: string | null, label: string, sectionTasks: Task[]) {
    const isCollapsed = collapsed.has(sectionId ?? '__null')
    return (
      <div key={sectionId ?? '__null'}>
        <div
          className="flex border-b border-border cursor-pointer select-none"
          onClick={() => toggleSection(sectionId ?? '__null')}
        >
          <div className="w-48 flex-shrink-0 sticky left-0 z-10 bg-muted/30 border-r border-border px-3 py-1.5 flex items-center gap-1">
            {isCollapsed
              ? <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            }
            <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
            <span className="text-xs text-muted-foreground ml-1">({sectionTasks.length})</span>
          </div>
          <div className="flex-shrink-0 bg-muted/30" style={{ width: totalWidth }} />
        </div>
        {!isCollapsed && sectionTasks.map(renderTaskRow)}
      </div>
    )
  }

  const unsectioned = tasksBySection.get(null) ?? []
  const unscheduled = tasks.filter((t) => !t.parent_id && !t.start_date && !t.due_date)

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ minWidth: 192 + totalWidth }}>
        {/* Header — sticky on vertical scroll */}
        <div className="flex sticky top-0 z-20 bg-background border-b border-border">
          <div className="w-48 flex-shrink-0 sticky left-0 z-30 bg-background border-r border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Task</span>
          </div>
          <div className="relative flex-shrink-0" style={{ width: totalWidth }}>
            {/* Month / day labels */}
            <div className="flex h-8 items-end">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn('flex-shrink-0 text-center border-r border-border/30 relative', dayWidth < 20 ? 'pb-0.5' : 'pb-1')}
                  style={{ width: dayWidth }}
                >
                  {(i === 0 || !isSameMonth(day, days[i - 1])) && (
                    <span className="absolute -top-0 left-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {format(day, 'MMM yyyy')}
                    </span>
                  )}
                  {dayWidth >= 20 && (
                    <span className={cn('text-xs', isToday(day) ? 'font-bold text-primary' : 'text-muted-foreground')}>
                      {format(day, 'd')}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* Today marker */}
            {todayOffset >= 0 && todayOffset < days.length && (
              <div
                className="absolute top-0 bottom-0 w-px bg-primary/60 pointer-events-none"
                style={{ left: todayOffset * dayWidth + dayWidth / 2 }}
              />
            )}
          </div>
        </div>

        {/* Section groups */}
        {sections.map((s) => renderSectionGroup(s.id, s.name, tasksBySection.get(s.id) ?? []))}

        {/* Tasks without a section */}
        {unsectioned.length > 0 && renderSectionGroup(null, 'No Section', unsectioned)}

        {/* Unscheduled tasks listing (no bars) */}
        {unscheduled.length > 0 && (
          <div className="border-t border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground">
            {unscheduled.length} unscheduled task{unscheduled.length !== 1 ? 's' : ''} — set dates to show on timeline
          </div>
        )}
      </div>
    </div>
  )
}
