import { useState } from 'react'
import { Play, CheckCircle2, Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  useSprints,
  useCreateSprint,
  useStartSprint,
  useUpdateSprint,
  useDeleteSprint,
  type Sprint,
} from '../hooks/use-sprints'
import { SprintCompleteDialog } from './sprint-complete-dialog'

interface Props {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EditState {
  name: string
  goal: string
  start_date: string
  end_date: string
}

function toInputDate(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function SprintManageDialog({ projectId, open, onOpenChange }: Props) {
  const { data: sprints = [] } = useSprints(projectId)
  const createSprint = useCreateSprint(projectId)
  const startSprint = useStartSprint(projectId)
  const updateSprint = useUpdateSprint(projectId)
  const deleteSprint = useDeleteSprint(projectId)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', goal: '', start_date: '', end_date: '' })
  const [completeSprintId, setCompleteSprintId] = useState<string | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    createSprint.mutate({ name: newName.trim() })
    setNewName('')
  }

  function startEditing(sprint: Sprint) {
    setEditingId(sprint.id)
    setEditState({
      name: sprint.name,
      goal: sprint.goal ?? '',
      start_date: toInputDate(sprint.start_date),
      end_date: toInputDate(sprint.end_date),
    })
  }

  function handleSaveEdit() {
    if (!editingId || !editState.name.trim()) return
    updateSprint.mutate({
      sprintId: editingId,
      data: {
        name: editState.name.trim(),
        goal: editState.goal || null,
        start_date: editState.start_date || null,
        end_date: editState.end_date || null,
      },
    })
    setEditingId(null)
  }

  function handleDelete(sprintId: string) {
    deleteSprint.mutate(sprintId)
    if (editingId === sprintId) setEditingId(null)
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

          {/* Create */}
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

          {/* Sprint list */}
          <div className="space-y-2 mt-2">
            {activeSprints.map((sprint) => (
              <div key={sprint.id} className="rounded border border-border">
                {/* Sprint row */}
                <div className="flex items-center gap-2 p-2">
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
                    <Button size="icon-sm" variant="ghost" title="Start sprint" onClick={() => startSprint.mutate(sprint.id)}>
                      <Play className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                  )}
                  {sprint.status === 'active' && (
                    <Button size="icon-sm" variant="ghost" title="Complete sprint" onClick={() => setCompleteSprintId(sprint.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => startEditing(sprint)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {sprint.status === 'planning' && (
                    <Button size="icon-sm" variant="ghost" title="Delete sprint" onClick={() => handleDelete(sprint.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </div>

                {/* Inline edit form */}
                {editingId === sprint.id && (
                  <div className="border-t border-border p-2 space-y-2 bg-muted/30">
                    <input
                      value={editState.name}
                      onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Sprint name"
                      className="w-full text-sm border border-border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <textarea
                      value={editState.goal}
                      onChange={(e) => setEditState((s) => ({ ...s, goal: e.target.value }))}
                      placeholder="Sprint goal (optional)"
                      rows={2}
                      className="w-full text-sm border border-border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground">Start</label>
                        <input
                          type="date"
                          value={editState.start_date}
                          onChange={(e) => setEditState((s) => ({ ...s, start_date: e.target.value }))}
                          className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground">End</label>
                        <input
                          type="date"
                          value={editState.end_date}
                          onChange={(e) => setEditState((s) => ({ ...s, end_date: e.target.value }))}
                          className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" className="h-6 text-xs" onClick={handleSaveEdit}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Completed */}
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

      {completeSprintId && (
        <SprintCompleteDialog
          projectId={projectId}
          sprintId={completeSprintId}
          open={true}
          onOpenChange={(v) => !v && setCompleteSprintId(null)}
        />
      )}
    </>
  )
}
