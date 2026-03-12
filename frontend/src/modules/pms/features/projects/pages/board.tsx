import { useParams } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQuery } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { useSections, useTasks, useMoveTask, type Task } from '../hooks/use-project-tasks'
import { useBacklogTasks } from '../hooks/use-backlog-tasks'
import { useSprints } from '../hooks/use-sprints'
import { BoardTaskCard } from '../components/board-task-card'
import { BoardKanbanColumn } from '../components/board-kanban-column'
import { BoardAddSectionInput } from '../components/board-add-section-input'
import { SprintSelector } from '../components/sprint-selector'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { ProjectHeader } from '../components/project-header'
import { FilterBar, type PriorityFilter, type StatusFilter } from '../components/filter-bar'
import { useTags } from '@/modules/pms/features/tags/hooks/use-tags'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

/** Calculate fractional position for inserting a task at a given index within a sorted task list */
function calcDropPosition(sortedTasks: Task[], dropIndex: number): number {
  if (dropIndex <= 0) {
    return sortedTasks.length > 0 ? sortedTasks[0].position / 2 : 65536
  }
  if (dropIndex >= sortedTasks.length) {
    return sortedTasks[sortedTasks.length - 1].position + 65536
  }
  return (sortedTasks[dropIndex - 1].position + sortedTasks[dropIndex].position) / 2
}

function daysRemainingText(endDate: string | null): { text: string; overdue: boolean } | null {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
  if (diff > 0) return { text: `${diff} day${diff !== 1 ? 's' : ''} left`, overdue: false }
  if (diff === 0) return { text: 'Ends today', overdue: false }
  return { text: `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`, overdue: true }
}

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sections = [] } = useSections(projectId!)
  const { data: allTasks = [] } = useTasks(projectId!)
  const { data: backlogTasks = [] } = useBacklogTasks(projectId!)
  const { data: sprints = [] } = useSprints(projectId!)
  const moveTask = useMoveTask(projectId!)

  const { data: project } = useQuery<{ workspace_id: string; project_type: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const { data: tags = [] } = useTags(workspaceId)

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterTagId, setFilterTagId] = useState<string | null>(null)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)

  const isAgile = project?.project_type === 'agile'
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)

  // Auto-select active sprint on mount for agile projects
  const activeSprint = sprints.find((s) => s.status === 'active')
  useEffect(() => {
    if (isAgile && selectedSprintId === null && activeSprint) {
      setSelectedSprintId(activeSprint.id)
    }
  }, [isAgile, activeSprint?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // For agile projects: filter tasks by sprint; non-agile always shows all tasks
  const tasks = isAgile
    ? (selectedSprintId
      ? allTasks.filter((t) => t.sprint_id === selectedSprintId)
      : backlogTasks)
    : allTasks

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const sortedSections = [...sections].sort((a, b) => a.position - b.position)

  const allTasksForSection = useCallback((sectionId: string) => {
    return allTasks
      .filter((t) => t.section_id === sectionId && !t.parent_id)
      .sort((a, b) => a.position - b.position)
  }, [allTasks])

  const visibleTasksForSection = useCallback((sectionId: string) => {
    return tasks
      .filter((t) => t.section_id === sectionId && !t.parent_id)
      .sort((a, b) => a.position - b.position)
      .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
      .filter((t) => filterStatus === 'all' || t.status === filterStatus)
      .filter((t) => !filterTagId || t.tags?.some((tag) => tag.id === filterTagId))
  }, [tasks, filterPriority, filterStatus, filterTagId])

  function handleDragStart(e: DragStartEvent) {
    const task = tasks.find((t) => t.id === e.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const overId = String(over.id)
    let targetSectionId: string | null
    if (overId.startsWith('column-')) {
      targetSectionId = overId.replace('column-', '')
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      targetSectionId = overTask?.section_id ?? draggedTask.section_id
    }

    const sectionTasks = allTasksForSection(targetSectionId ?? '')
      .filter((t) => t.id !== draggedTask.id)

    let dropIndex: number
    if (overId.startsWith('column-')) {
      dropIndex = sectionTasks.length
    } else {
      const overIndex = sectionTasks.findIndex((t) => t.id === overId)
      dropIndex = overIndex >= 0 ? overIndex : sectionTasks.length
    }

    const newPosition = calcDropPosition(sectionTasks, dropIndex)
    if (targetSectionId === draggedTask.section_id && active.id === over.id) return
    moveTask.mutate({ taskId: draggedTask.id, sectionId: targetSectionId, position: newPosition })
  }

  const remaining = selectedSprint ? daysRemainingText(selectedSprint.end_date) : null

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="board" />
        <FilterBar
          priority={filterPriority}
          status={filterStatus}
          onPriority={setFilterPriority}
          onStatus={setFilterStatus}
          tags={tags}
          selectedTagId={filterTagId}
          onTag={setFilterTagId}
        />
        {isAgile && (
          <SprintSelector
            projectId={projectId!}
            selectedSprintId={selectedSprintId}
            onSelect={setSelectedSprintId}
          />
        )}

        {/* Sprint goal banner */}
        {isAgile && selectedSprint?.goal && (
          <div className="flex items-center gap-2 px-6 py-1.5 bg-muted/30 border-b border-border">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground italic">{selectedSprint.goal}</span>
            {remaining && (
              <Badge
                variant="outline"
                className={`text-[10px] ml-auto ${remaining.overdue ? 'border-red-400 text-red-600' : ''}`}
              >
                {remaining.text}
              </Badge>
            )}
          </div>
        )}

        <div className="flex-1 overflow-x-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full">
              {sortedSections.map((section) => (
                <BoardKanbanColumn
                  key={section.id}
                  section={section}
                  tasks={visibleTasksForSection(section.id)}
                  projectId={projectId!}
                  onOpenTask={setSelectedTask}
                />
              ))}
              <BoardAddSectionInput projectId={projectId!} sections={sortedSections} />
            </div>
            <DragOverlay>
              {activeTask && <BoardTaskCard task={activeTask} projectId={projectId!} />}
            </DragOverlay>
          </DndContext>
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
