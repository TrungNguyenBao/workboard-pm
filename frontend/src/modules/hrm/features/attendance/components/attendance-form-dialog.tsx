import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { type AttendanceRecord, useCreateAttendance, useUpdateAttendance } from '../hooks/use-attendance'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  record?: AttendanceRecord | null
}

export function AttendanceFormDialog({ open, onOpenChange, workspaceId, record }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <AttendanceFormContent workspaceId={workspaceId} record={record} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function AttendanceFormContent({ workspaceId, record, onOpenChange }: Omit<Props, 'open'>) {
  const createRecord = useCreateAttendance(workspaceId)
  const updateRecord = useUpdateAttendance(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })
  const isEdit = !!record

  const [employeeId, setEmployeeId] = useState(record?.employee_id ?? '')
  const [date, setDate] = useState(record?.date ?? '')
  const [checkIn, setCheckIn] = useState(record?.check_in ?? '')
  const [checkOut, setCheckOut] = useState(record?.check_out ?? '')
  const [status, setStatus] = useState(record?.status ?? 'present')
  const [overtimeHours, setOvertimeHours] = useState(record?.overtime_hours?.toString() ?? '0')
  const [notes, setNotes] = useState(record?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = {
        check_in: checkIn || null,
        check_out: checkOut || null,
        status,
        overtime_hours: parseFloat(overtimeHours) || 0,
        notes: notes || null,
      }
      if (isEdit) {
        await updateRecord.mutateAsync({ recordId: record.id, ...payload })
        toast({ title: 'Attendance record updated', variant: 'success' })
      } else {
        await createRecord.mutateAsync({ employee_id: employeeId, date, ...payload })
        toast({ title: 'Attendance record created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save attendance record', variant: 'error' })
    }
  }

  const pending = createRecord.isPending || updateRecord.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit attendance record' : 'New attendance record'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
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
        )}
        {!isEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="att-date">Date *</Label>
            <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="att-check-in">Check In</Label>
            <Input id="att-check-in" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="att-check-out">Check Out</Label>
            <Input id="att-check-out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="att-overtime">Overtime Hours</Label>
            <Input id="att-overtime" type="number" min="0" step="0.5" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-notes">Notes</Label>
          <Input id="att-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || (!isEdit && (!employeeId || !date))}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
