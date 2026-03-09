import { useState } from 'react'
import { Play, CheckCircle2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useSprints, useCreateSprint, useStartSprint, useCompleteSprint } from '../hooks/use-sprints'

interface Props {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ConfirmCompleteDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmCompleteDialog({ open, onConfirm, onCancel }: ConfirmCompleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete Sprint?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Incomplete tasks will remain in the backlog. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={onConfirm}>
            Complete Sprint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SprintManageDialog({ projectId, open, onOpenChange }: Props) {
  const { data: sprints = [] } = useSprints(projectId)
  const createSprint = useCreateSprint(projectId)
  const startSprint = useStartSprint(projectId)
  const completeSprint = useCompleteSprint(projectId)
  const [newName, setNewName] = useState('')
  const [confirmSprintId, setConfirmSprintId] = useState<string | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    createSprint.mutate({ name: newName.trim() })
    setNewName('')
  }

  function handleConfirmComplete() {
    if (confirmSprintId) completeSprint.mutate(confirmSprintId)
    setConfirmSprintId(null)
  }

  const activeSprints = sprints.filter((s) => s.status !== 'completed')
  const completedSprints = sprints.filter((s) => s.status === 'completed')

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Sprints</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New sprint name..."
              className="flex-1 text-sm border border-border rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/40 bg-background"
            />
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create
            </Button>
          </div>

          <div className="space-y-2 mt-2">
            {activeSprints.map((sprint) => (
              <div key={sprint.id} className="flex items-center gap-2 p-2 rounded border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sprint.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sprint.task_count} tasks | {sprint.completed_points}/{sprint.total_points} pts
                  </p>
                </div>
                <Badge variant={sprint.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {sprint.status}
                </Badge>
                {sprint.status === 'planning' && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Start sprint"
                    onClick={() => startSprint.mutate(sprint.id)}
                  >
                    <Play className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                )}
                {sprint.status === 'active' && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Complete sprint"
                    onClick={() => setConfirmSprintId(sprint.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {completedSprints.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                {completedSprints.length} completed sprint(s)
              </summary>
              <div className="space-y-1 mt-1">
                {completedSprints.slice(0, 5).map((sprint) => (
                  <div key={sprint.id} className="flex items-center gap-2 p-1.5 text-xs opacity-60">
                    <span className="truncate flex-1">{sprint.name}</span>
                    <span className="text-muted-foreground">{sprint.completed_points} pts</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmCompleteDialog
        open={confirmSprintId !== null}
        onConfirm={handleConfirmComplete}
        onCancel={() => setConfirmSprintId(null)}
      />
    </>
  )
}
