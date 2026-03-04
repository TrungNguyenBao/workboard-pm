import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useCreateInterview } from '../hooks/use-interviews'
import { useEmployees } from '../../employees/hooks/use-employees'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  candidateId: string
}

export function InterviewFormDialog({ open, onOpenChange, workspaceId, candidateId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <FormContent workspaceId={workspaceId} candidateId={candidateId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function FormContent({ workspaceId, candidateId, onOpenChange }: Omit<Props, 'open'>) {
  const createInterview = useCreateInterview(workspaceId)
  const { data: empData } = useEmployees(workspaceId, { page_size: 100 })

  const [interviewerId, setInterviewerId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduledAt) return
    try {
      await createInterview.mutateAsync({
        candidate_id: candidateId,
        interviewer_id: interviewerId || null,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(durationMinutes) || 60,
      })
      toast({ title: 'Interview scheduled', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to schedule interview', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Schedule Interview</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Interviewer</Label>
          <Select value={interviewerId} onValueChange={setInterviewerId}>
            <SelectTrigger><SelectValue placeholder="Select interviewer (optional)" /></SelectTrigger>
            <SelectContent>
              {(empData?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="iv-date">Date & Time *</Label>
            <Input id="iv-date" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iv-dur">Duration (min)</Label>
            <Input id="iv-dur" type="number" min="15" step="15" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createInterview.isPending || !scheduledAt}>
            {createInterview.isPending ? 'Scheduling...' : 'Schedule'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
