import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useDepartments } from '../../departments/hooks/use-departments'
import { type Position, useCreatePosition, useUpdatePosition } from '../hooks/use-positions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  position?: Position | null
}

export function PositionFormDialog({ open, onOpenChange, workspaceId, position }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <PositionFormContent workspaceId={workspaceId} position={position} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function PositionFormContent({ workspaceId, position, onOpenChange }: Omit<Props, 'open'>) {
  const createPosition = useCreatePosition(workspaceId)
  const updatePosition = useUpdatePosition(workspaceId)
  const { data: deptData } = useDepartments(workspaceId, { page_size: 100 })
  const isEdit = !!position

  const [title, setTitle] = useState(position?.title ?? '')
  const [departmentId, setDepartmentId] = useState(position?.department_id ?? '')
  const [headcountLimit, setHeadcountLimit] = useState(position?.headcount_limit ?? 0)
  const [description, setDescription] = useState(position?.description ?? '')
  const [isActive, setIsActive] = useState(position?.is_active ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !departmentId) return
    try {
      const payload = {
        title: title.trim(),
        department_id: departmentId,
        headcount_limit: headcountLimit,
        description: description.trim() || null,
        is_active: isActive,
      }
      if (isEdit) {
        await updatePosition.mutateAsync({ positionId: position.id, ...payload })
        toast({ title: 'Position updated', variant: 'success' })
      } else {
        await createPosition.mutateAsync(payload)
        toast({ title: 'Position created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save position', variant: 'error' })
    }
  }

  const pending = createPosition.isPending || updatePosition.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit position' : 'New position'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pos-title">Title *</Label>
          <Input id="pos-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pos-dept">Department *</Label>
          <select
            id="pos-dept"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select department</option>
            {deptData?.items.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pos-headcount">Headcount limit (0 = unlimited)</Label>
          <Input
            id="pos-headcount"
            type="number"
            min={0}
            value={headcountLimit}
            onChange={(e) => setHeadcountLimit(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pos-desc">Description</Label>
          <textarea
            id="pos-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="pos-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="pos-active">Active</Label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !title.trim() || !departmentId}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
