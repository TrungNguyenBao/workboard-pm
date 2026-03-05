import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreateHandoverTask } from '../hooks/use-offboarding'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  resignationId: string
  fromEmployeeId?: string
}

export function HandoverTaskFormDialog({ open, onOpenChange, workspaceId, resignationId, fromEmployeeId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <HandoverTaskFormContent
        workspaceId={workspaceId}
        resignationId={resignationId}
        fromEmployeeId={fromEmployeeId}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  )
}

function HandoverTaskFormContent({
  workspaceId, resignationId, fromEmployeeId, onOpenChange,
}: Omit<Props, 'open'>) {
  const createTask = useCreateHandoverTask(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })

  const [taskName, setTaskName] = useState('')
  const [toEmployeeId, setToEmployeeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!taskName) return
    try {
      await createTask.mutateAsync({
        resignation_id: resignationId,
        task_name: taskName,
        from_employee_id: fromEmployeeId ?? null,
        to_employee_id: toEmployeeId || null,
        due_date: dueDate || null,
        notes: notes || null,
      })
      toast({ title: 'Handover task created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create task', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add Handover Task</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-name">Task Name *</Label>
          <Input
            id="task-name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g. Transfer project documentation"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Assign To</Label>
          <Select value={toEmployeeId} onValueChange={setToEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {(employeesData?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ht-due">Due Date</Label>
          <Input
            id="ht-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ht-notes">Notes</Label>
          <textarea
            id="ht-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Additional notes..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createTask.isPending || !taskName}>
            {createTask.isPending ? 'Creating...' : 'Add Task'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
