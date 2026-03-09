import { useParams } from 'react-router-dom'
import { useState, useCallback } from 'react'
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
import { useSections, useTasks, useMoveTask, type Task } from '../hooks/use-project-tasks'
import { useBacklogTasks } from '../hooks/use-backlog-tasks'
import { BoardTaskCard } from '../components/board-task-card'
import { BoardKanbanColumn } from '../components/board-kanban-column'
import { BoardAddSectionInput } from '../components/board-add-section-input'
import { SprintSelector } from '../components/sprint-selector'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { ProjectHeader } from '../components/project-header'
import { FilterBar, type PriorityFilter, type StatusFilter } from '../components/filter-bar'
import api from '@/shared/lib/api'

/** Calculate fractional position for inserting a task at a given index within a sorted task list */
function calcDropPosition(sortedTasks: Task[], dropIndex: number): number {
  // Dropping at the start
  if (dropIndex <= 0) {
    return sortedTasks.length > 0 ? sortedTasks[0].position / 2 : 65536
  }
  // Dropping at the end
  if (dropIndex >= sortedTasks.length) {
    return sortedTasks[sortedTasks.length - 1].position + 65536
  }
  // Dropping between two tasks
  return (sortedTasks[dropIndex - 1].position + sortedTasks[dropIndex].position) / 2
}

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sections = [] } = useSections(projectId!)
  const { data: allTasks = [] } = useTasks(projectId!)
  const { data: backlogTasks = [] } = useBacklogTasks(projectId!)
  const moveTask = useMoveTask(projectId!)

  const { data: project } = useQuery<{ workspace_id: string; project_type: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)

  // For agile projects: filter tasks by sprint; non-agile always shows all tasks
  const isAgile = project?.project_type === 'agile'
  const tasks = isAgile
    ? (selectedSprintId
      ? allTasks.filter((t) => t.sprint_id === selectedSprintId)
      : backlogTasks)
    : allTasks

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const sortedSections = [...sections].sort((a, b) => a.position - b.position)

  /** All tasks in a section (unfiltered), used for position calculation during drag-drop */
  const allTasksForSection = useCallback((sectionId: string) => {
    return allTasks
      .filter((t) => t.section_id === sectionId && !t.parent_id)
      .sort((a, b) => a.position - b.position)
  }, [allTasks])

  /** Visible tasks in a section (sprint + priority/status filters applied), used for rendering */
  const visibleTasksForSection = useCallback((sectionId: string) => {
    return tasks
      .filter((t) => t.section_id === sectionId && !t.parent_id)
      .sort((a, b) => a.position - b.position)
      .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
      .filter((t) => filterStatus === 'all' || t.status === filterStatus)
  }, [tasks, filterPriority, filterStatus])

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

    // Determine target section: over a column droppable or over a task
    const overId = String(over.id)
    let targetSectionId: string | null
    if (overId.startsWith('column-')) {
      targetSectionId = overId.replace('column-', '')
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      targetSectionId = overTask?.section_id ?? draggedTask.section_id
    }

    // Use unfiltered tasks for position calculation to avoid colliding with hidden filtered tasks
    const sectionTasks = allTasksForSection(targetSectionId ?? '')
      .filter((t) => t.id !== draggedTask.id)

    // Find drop index based on where the task was dropped
    let dropIndex: number
    if (overId.startsWith('column-')) {
      // Dropped on column itself → place at end
      dropIndex = sectionTasks.length
    } else {
      // Dropped on/near a specific task → insert at that task's position
      const overIndex = sectionTasks.findIndex((t) => t.id === overId)
      dropIndex = overIndex >= 0 ? overIndex : sectionTasks.length
    }

    const newPosition = calcDropPosition(sectionTasks, dropIndex)

    // Skip if same section and same position neighborhood (no actual move)
    if (targetSectionId === draggedTask.section_id && active.id === over.id) return

    moveTask.mutate({ taskId: draggedTask.id, sectionId: targetSectionId, position: newPosition })
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="board" />
        <FilterBar
          priority={filterPriority}
          status={filterStatus}
          onPriority={setFilterPriority}
          onStatus={setFilterStatus}
        />
        {isAgile && (
          <SprintSelector
            projectId={projectId!}
            selectedSprintId={selectedSprintId}
            onSelect={setSelectedSprintId}
          />
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
