import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
import { Button } from '@/shared/components/ui/button'
import { ProjectHeader } from '../components/project-header'
import { BacklogSprintSection } from '../components/backlog-sprint-section'
import { BacklogTaskRow } from '../components/backlog-task-row'
import { SprintCompleteDialog } from '../components/sprint-complete-dialog'
import { SprintManageDialog } from '../components/sprint-manage-dialog'
import { TaskDetailDrawer } from '@/modules/pms/features/tasks/components/task-detail-drawer'
import { useSprints, useCreateSprint, useStartSprint } from '../hooks/use-sprints'
import { useTasks, useUpdateTask, type Task } from '../hooks/use-project-tasks'
import { useBacklogTasks } from '../hooks/use-backlog-tasks'
import api from '@/shared/lib/api'

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sprints = [] } = useSprints(projectId!)
  const { data: allTasks = [] } = useTasks(projectId!)
  const { data: backlogTasks = [] } = useBacklogTasks(projectId!)
  const updateTask = useUpdateTask(projectId!)
  const createSprint = useCreateSprint(projectId!)
  const startSprint = useStartSprint(projectId!)

  const { data: project } = useQuery<{ workspace_id: string }>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [completeSprintId, setCompleteSprintId] = useState<string | null>(null)
  const [editSprint, setEditSprint] = useState<{ open: boolean }>({ open: false })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Group sprints: planning first, then active (reverse chrono)
  const nonCompletedSprints = sprints
    .filter((s) => s.status !== 'completed')
    .sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return 1
      if (b.status === 'active' && a.status !== 'active') return -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Tasks grouped by sprint
  const tasksForSprint = useCallback(
    (sprintId: string) =>
      allTasks
        .filter((t) => t.sprint_id === sprintId && !t.parent_id)
        .sort((a, b) => a.position - b.position),
    [allTasks],
  )

  const backlogItems = backlogTasks.filter((t) => !t.parent_id).sort((a, b) => a.position - b.position)

  function handleMoveTo(taskId: string, sprintId: string | null) {
    updateTask.mutate({ taskId, sprint_id: sprintId })
  }

  function handleDragStart(e: DragStartEvent) {
    const all = [...allTasks, ...backlogTasks]
    const task = all.find((t) => t.id === e.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return

    const all = [...allTasks, ...backlogTasks]
    const draggedTask = all.find((t) => t.id === active.id)
    if (!draggedTask) return

    const overId = String(over.id)

    // Determine target sprint from droppable id
    let targetSprintId: string | null
    if (overId.startsWith('sprint-backlog')) {
      targetSprintId = null
    } else if (overId.startsWith('sprint-')) {
      targetSprintId = overId.replace('sprint-', '')
    } else {
      // Dropped on a task — find that task's sprint_id
      const overTask = all.find((t) => t.id === overId)
      targetSprintId = overTask?.sprint_id ?? null
    }

    // Only update if sprint changed
    if (targetSprintId !== draggedTask.sprint_id) {
      updateTask.mutate({ taskId: draggedTask.id, sprint_id: targetSprintId })
    }
  }

  function handleCreateSprint() {
    const count = sprints.length + 1
    createSprint.mutate({ name: `Sprint ${count}` })
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader
          activeView="backlog"
          actions={
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleCreateSprint}>
              <Plus className="h-3.5 w-3.5" /> Create Sprint
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Sprint sections (planning first, then active) */}
            {nonCompletedSprints.map((sprint) => (
              <BacklogSprintSection
                key={sprint.id}
                sprint={sprint}
                tasks={tasksForSprint(sprint.id)}
                allSprints={sprints}
                onOpenTask={setSelectedTask}
                onMoveTo={handleMoveTo}
                onStartSprint={(id) => startSprint.mutate(id)}
                onCompleteSprint={(id) => setCompleteSprintId(id)}
                onEditSprint={() => setEditSprint({ open: true })}
              />
            ))}

            {/* Backlog section */}
            <BacklogSprintSection
              sprint={null}
              tasks={backlogItems}
              allSprints={sprints}
              onOpenTask={setSelectedTask}
              onMoveTo={handleMoveTo}
            />

            <DragOverlay>
              {activeTask && (
                <div className="bg-background border border-border rounded shadow-lg px-3 py-1.5">
                  <BacklogTaskRow
                    task={activeTask}
                    sprints={sprints}
                    onOpenTask={() => {}}
                    onMoveTo={() => {}}
                  />
                </div>
              )}
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

      {completeSprintId && (
        <SprintCompleteDialog
          projectId={projectId!}
          sprintId={completeSprintId}
          open={true}
          onOpenChange={(open) => !open && setCompleteSprintId(null)}
        />
      )}

      <SprintManageDialog
        projectId={projectId!}
        open={editSprint.open}
        onOpenChange={(open) => setEditSprint({ open })}
      />
    </>
  )
}
