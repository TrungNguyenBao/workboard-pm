import { useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { useSprints, useCompleteSprint } from '../hooks/use-sprints'
import { useTasks } from '../hooks/use-project-tasks'

interface Props {
  projectId: string
  sprintId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SprintCompleteDialog({ projectId, sprintId, open, onOpenChange }: Props) {
  const { data: sprints = [] } = useSprints(projectId)
  const { data: allTasks = [] } = useTasks(projectId)
  const completeSprint = useCompleteSprint(projectId)
  const [moveTarget, setMoveTarget] = useState<string | null>(null) // null = backlog

  const sprint = sprints.find((s) => s.id === sprintId)
  const sprintTasks = allTasks.filter((t) => t.sprint_id === sprintId && !t.parent_id)
  const completedTasks = sprintTasks.filter((t) => t.status === 'completed')
  const incompleteTasks = sprintTasks.filter((t) => t.status !== 'completed')
  const completedPoints = completedTasks.reduce((s, t) => s + (t.story_points ?? 0), 0)
  const incompletePoints = incompleteTasks.reduce((s, t) => s + (t.story_points ?? 0), 0)

  // Available target sprints (planning or other active, excluding current)
  const targetSprints = sprints.filter((s) => s.id !== sprintId && s.status !== 'completed')

  function handleComplete() {
    completeSprint.mutate(
      { sprintId, moveToSprintId: moveTarget },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  if (!sprint) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Sprint "{sprint.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <span>
              <strong>{completedTasks.length}</strong> task{completedTasks.length !== 1 ? 's' : ''} completed
              {completedPoints > 0 && ` (${completedPoints} pts)`}
            </span>
          </div>

          {incompleteTasks.length > 0 && (
            <>
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>
                  <strong>{incompleteTasks.length}</strong> task{incompleteTasks.length !== 1 ? 's' : ''} incomplete
                  {incompletePoints > 0 && ` (${incompletePoints} pts)`}
                </span>
              </div>

              {/* Migration target */}
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Move incomplete tasks to:</p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="move-target"
                    checked={moveTarget === null}
                    onChange={() => setMoveTarget(null)}
                    className="accent-primary"
                  />
                  Backlog
                </label>
                {targetSprints.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="move-target"
                      checked={moveTarget === s.id}
                      onChange={() => setMoveTarget(s.id)}
                      className="accent-primary"
                    />
                    {s.name}
                    <span className="text-xs text-muted-foreground">({s.status})</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleComplete} disabled={completeSprint.isPending}>
            Complete Sprint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
