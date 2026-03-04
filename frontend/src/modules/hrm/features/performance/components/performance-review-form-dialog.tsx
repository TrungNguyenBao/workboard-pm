import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreatePerformanceReview } from '../hooks/use-performance-reviews'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function PerformanceReviewFormDialog({ open, onOpenChange, workspaceId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <PerformanceReviewFormContent workspaceId={workspaceId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function PerformanceReviewFormContent({ workspaceId, onOpenChange }: Omit<Props, 'open'>) {
  const create = useCreatePerformanceReview(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })

  const [employeeId, setEmployeeId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [period, setPeriod] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !reviewerId || !period) return
    try {
      await create.mutateAsync({ employee_id: employeeId, reviewer_id: reviewerId, period })
      toast({ title: 'Performance review created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create review', variant: 'error' })
    }
  }

  const employees = employeesData?.items ?? []

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New Performance Review</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Employee *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Reviewer *</Label>
          <Select value={reviewerId} onValueChange={setReviewerId}>
            <SelectTrigger><SelectValue placeholder="Select reviewer" /></SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pr-period">Period *</Label>
          <Input id="pr-period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026 or 2026-HY1" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || !employeeId || !reviewerId || !period}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
