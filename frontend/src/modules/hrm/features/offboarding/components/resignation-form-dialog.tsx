import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreateResignation } from '../hooks/use-offboarding'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function ResignationFormDialog({ open, onOpenChange, workspaceId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <ResignationFormContent workspaceId={workspaceId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function ResignationFormContent({ workspaceId, onOpenChange }: Omit<Props, 'open'>) {
  const createResignation = useCreateResignation(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })

  const [employeeId, setEmployeeId] = useState('')
  const [resignationDate, setResignationDate] = useState('')
  const [lastWorkingDay, setLastWorkingDay] = useState('')
  const [reason, setReason] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !resignationDate || !lastWorkingDay) return
    try {
      await createResignation.mutateAsync({
        employee_id: employeeId,
        resignation_date: resignationDate,
        last_working_day: lastWorkingDay,
        reason: reason || null,
      })
      toast({ title: 'Resignation submitted', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to submit resignation', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New Resignation</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="res-date">Resignation Date *</Label>
            <Input
              id="res-date"
              type="date"
              value={resignationDate}
              onChange={(e) => setResignationDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lwd">Last Working Day *</Label>
            <Input
              id="lwd"
              type="date"
              value={lastWorkingDay}
              onChange={(e) => setLastWorkingDay(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason</Label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional reason for resignation..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="submit"
            disabled={createResignation.isPending || !employeeId || !resignationDate || !lastWorkingDay}
          >
            {createResignation.isPending ? 'Submitting...' : 'Submit Resignation'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
