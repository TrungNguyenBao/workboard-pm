import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreateTrainingEnrollment } from '../hooks/use-training-enrollments'
import { type TrainingProgram } from '../hooks/use-training-programs'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  programs: TrainingProgram[]
}

export function EnrollmentFormDialog({ open, onOpenChange, workspaceId, programs }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <EnrollmentFormContent workspaceId={workspaceId} programs={programs} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function EnrollmentFormContent({ workspaceId, programs, onOpenChange }: Omit<Props, 'open'>) {
  const create = useCreateTrainingEnrollment(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })

  const [programId, setProgramId] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!programId || !employeeId) return
    try {
      await create.mutateAsync({ program_id: programId, employee_id: employeeId })
      toast({ title: 'Employee enrolled', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to enroll — employee may already be enrolled', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Enroll Employee</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Training Program *</Label>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Employee *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {(employeesData?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || !programId || !employeeId}>
            {create.isPending ? 'Enrolling…' : 'Enroll'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
