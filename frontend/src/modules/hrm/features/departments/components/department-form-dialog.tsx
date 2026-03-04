import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { type Department, useCreateDepartment, useDepartments, useUpdateDepartment } from '../hooks/use-departments'

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
  const { t } = useTranslation('hrm')
  const createDepartment = useCreateDepartment(workspaceId)
  const updateDepartment = useUpdateDepartment(workspaceId)
  const { data: deptData } = useDepartments(workspaceId, { page_size: 100 })
  const { data: empData } = useEmployees(workspaceId, { page_size: 100 })
  const isEdit = !!department

  const [name, setName] = useState(department?.name ?? '')
  const [description, setDescription] = useState(department?.description ?? '')
  const [parentDeptId, setParentDeptId] = useState(department?.parent_department_id ?? '')
  const [managerId, setManagerId] = useState(department?.manager_id ?? '')

  // Exclude self from parent options when editing
  const parentOptions = deptData?.items.filter((d) => d.id !== department?.id) ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        parent_department_id: parentDeptId || null,
        manager_id: managerId || null,
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
      toast({ title: 'Failed to save department', variant: 'error' })
    }
  }

  const pending = createDepartment.isPending || updateDepartment.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit department' : t('departments.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dept-name">{t('common:common.name')} *</Label>
          <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dept-description">{t('common:common.description')}</Label>
          <Input id="dept-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dept-parent">Parent department</Label>
          <select
            id="dept-parent"
            value={parentDeptId}
            onChange={(e) => setParentDeptId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None (root department)</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dept-manager">Manager</Label>
          <select
            id="dept-manager"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">No manager assigned</option>
            {empData?.items.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('common:common.loading') : isEdit ? t('common:common.save') : t('departments.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
