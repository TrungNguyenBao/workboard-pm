import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Employee, useCreateEmployee, useUpdateEmployee } from '../hooks/use-employees'
import { useDepartments } from '../../departments/hooks/use-departments'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  employee?: Employee | null
}

export function EmployeeFormDialog({ open, onOpenChange, workspaceId, employee }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <EmployeeFormContent workspaceId={workspaceId} employee={employee} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function EmployeeFormContent({ workspaceId, employee, onOpenChange }: Omit<Props, 'open'>) {
  const createEmployee = useCreateEmployee(workspaceId)
  const updateEmployee = useUpdateEmployee(workspaceId)
  const { data: deptsData } = useDepartments(workspaceId, { page_size: 100 })
  const isEdit = !!employee

  const [name, setName] = useState(employee?.name ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [position, setPosition] = useState(employee?.position ?? '')
  const [hireDate, setHireDate] = useState(employee?.hire_date?.split('T')[0] ?? '')
  const [departmentId, setDepartmentId] = useState(employee?.department_id ?? 'none')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        position: position.trim() || null,
        hire_date: hireDate || null,
        department_id: departmentId === 'none' ? null : departmentId,
      }
      if (isEdit) {
        await updateEmployee.mutateAsync({ employeeId: employee.id, ...payload })
        toast({ title: 'Employee updated', variant: 'success' })
      } else {
        await createEmployee.mutateAsync(payload)
        toast({ title: 'Employee created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: `Failed to ${isEdit ? 'update' : 'create'} employee`, variant: 'error' })
    }
  }

  const pending = createEmployee.isPending || updateEmployee.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit employee' : 'New employee'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="emp-name">Name *</Label>
          <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emp-email">Email *</Label>
          <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="emp-position">Position</Label>
            <Input id="emp-position" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-hire-date">Hire date</Label>
            <Input id="emp-hire-date" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No department</SelectItem>
              {(deptsData?.items ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim() || !email.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save changes' : 'Create employee'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
