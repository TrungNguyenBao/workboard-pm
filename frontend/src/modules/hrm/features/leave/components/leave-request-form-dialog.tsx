import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useCreateLeaveRequest, useLeaveTypes } from '../hooks/use-leave'
import { useEmployees } from '../../employees/hooks/use-employees'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function LeaveRequestFormDialog({ open, onOpenChange, workspaceId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <LeaveRequestFormContent workspaceId={workspaceId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function LeaveRequestFormContent({ workspaceId, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('hrm')
  const createRequest = useCreateLeaveRequest(workspaceId)
  const { data: typesData } = useLeaveTypes(workspaceId, { page_size: 50 })
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })

  const [employeeId, setEmployeeId] = useState('')
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState('1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !leaveTypeId || !startDate || !endDate) return
    try {
      await createRequest.mutateAsync({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        days: parseInt(days) || 1,
      })
      toast({ title: 'Leave request created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create leave request', variant: 'error' })
    }

  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t('leave.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('employees.title')} *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {(employeesData?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Leave type *</Label>
          <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {(typesData?.items ?? []).map((lt) => (
                <SelectItem key={lt.id} value={lt.id}>{lt.name} ({lt.days_per_year}d/yr)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lr-start">Start *</Label>
            <Input id="lr-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lr-end">End *</Label>
            <Input id="lr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lr-days">Days</Label>
            <Input id="lr-days" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={createRequest.isPending || !employeeId || !leaveTypeId || !startDate || !endDate}>
            {createRequest.isPending ? t('common:common.loading') : t('leave.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
