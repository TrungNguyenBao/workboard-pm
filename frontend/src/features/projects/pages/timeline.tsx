import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { addWeeks, addMonths, format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { useTasks, useSections, useUpdateTask, type Task } from '../hooks/use-project-tasks'
import { ProjectHeader } from '../components/project-header'
import { TimelineGrid } from '../components/timeline-grid'
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer'
import api from '@/shared/lib/api'

type Zoom = 'week' | 'month'

/** Day width in pixels for each zoom level */
const DAY_WIDTH: Record<Zoom, number> = { week: 40, month: 12 }
/** How many weeks/months to show per zoom */
const RANGE_WEEKS: Record<Zoom, number> = { week: 8, month: 24 }

export default function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>()

  const { data: tasks = [] } = useTasks(projectId!)
  const { data: sections = [] } = useSections(projectId!)
  const updateTask = useUpdateTask(projectId!)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [zoom, setZoom] = useState<Zoom>('week')
  // Range start: 2 weeks before today by default
  const [rangeStart, setRangeStart] = useState(() => addWeeks(new Date(), -2))

  const dayWidth = DAY_WIDTH[zoom]
  const rangeEnd = zoom === 'week'
    ? addWeeks(rangeStart, RANGE_WEEKS.week)
    : addMonths(rangeStart, RANGE_WEEKS.month / 4)

  function shiftRange(direction: 1 | -1) {
    const shift = zoom === 'week' ? 2 : 4 // weeks to shift
    setRangeStart((prev) => addWeeks(prev, direction * shift))
  }

  function handleDatesChange(taskId: string, dates: { start_date?: string | null; due_date?: string | null }) {
    updateTask.mutate({ taskId, ...dates })
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader
          activeView="timeline"
          actions={
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-neutral-600 mr-1">
                {format(rangeStart, 'MMM d')} – {format(rangeEnd, 'MMM d, yyyy')}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => shiftRange(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRangeStart(addWeeks(new Date(), -2))}>
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => shiftRange(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {/* Zoom toggle */}
              <div className="ml-2 flex rounded border border-border overflow-hidden">
                {(['week', 'month'] as Zoom[]).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      zoom === z ? 'bg-primary text-white' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {z === 'week' ? 'Weeks' : 'Months'}
                  </button>
                ))}
              </div>
            </div>
          }
        />
        <TimelineGrid
          tasks={tasks}
          sections={sections}
          dayWidth={dayWidth}
          timelineStart={rangeStart}
          timelineEnd={rangeEnd}
          onClickTask={setSelectedTask}
          onDatesChange={handleDatesChange}
        />
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
