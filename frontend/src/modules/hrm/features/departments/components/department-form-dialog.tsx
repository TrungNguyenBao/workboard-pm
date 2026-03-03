import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type Department, useCreateDepartment, useUpdateDepartment } from '../hooks/use-departments'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  department?: Department | null
}

export function DepartmentFormDialog({ open, onOpenChange, workspaceId, department }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DepartmentFormContent workspaceId={workspaceId} department={department} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function DepartmentFormContent({ workspaceId, department, onOpenChange }: Omit<Props, 'open'>) {
  const createDepartment = useCreateDepartment(workspaceId)
  const updateDepartment = useUpdateDepartment(workspaceId)
  const isEdit = !!department

  const [name, setName] = useState(department?.name ?? '')
  const [description, setDescription] = useState(department?.description ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      }
      if (isEdit) {
        await updateDepartment.mutateAsync({ departmentId: department.id, ...payload })
        toast({ title: 'Department updated', variant: 'success' })
      } else {
        await createDepartment.mutateAsync(payload)
        toast({ title: 'Department created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: `Failed to ${isEdit ? 'update' : 'create'} department`, variant: 'error' })
    }
  }

  const pending = createDepartment.isPending || updateDepartment.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit department' : 'New department'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dept-name">Name *</Label>
          <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dept-description">Description</Label>
          <Input id="dept-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save changes' : 'Create department'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
