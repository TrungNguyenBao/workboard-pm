import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useCompleteInterview } from '../hooks/use-interviews'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  interviewId: string
}

export function InterviewFeedbackDialog({ open, onOpenChange, workspaceId, interviewId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <FormContent workspaceId={workspaceId} interviewId={interviewId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function FormContent({ workspaceId, interviewId, onOpenChange }: Omit<Props, 'open'>) {
  const completeInterview = useCompleteInterview(workspaceId)
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await completeInterview.mutateAsync({
        interviewId,
        feedback: feedback || undefined,
        score: score ? parseInt(score) : undefined,
      })
      toast({ title: 'Interview completed', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to complete interview', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Complete Interview</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fb-text">Feedback</Label>
          <textarea
            id="fb-text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-ring"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Interview notes and feedback..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Score (1–5)</Label>
          <Select value={score} onValueChange={setScore}>
            <SelectTrigger><SelectValue placeholder="Select score (optional)" /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} — {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][n - 1]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={completeInterview.isPending}>
            {completeInterview.isPending ? 'Saving...' : 'Mark Complete'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
