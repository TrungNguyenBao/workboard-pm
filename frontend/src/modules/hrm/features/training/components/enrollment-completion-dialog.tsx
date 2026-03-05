import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useCompleteEnrollment } from '../hooks/use-training-enrollments'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  enrollmentId: string
}

export function EnrollmentCompletionDialog({ open, onOpenChange, workspaceId, enrollmentId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <CompletionFormContent workspaceId={workspaceId} enrollmentId={enrollmentId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function CompletionFormContent({
  workspaceId,
  enrollmentId,
  onOpenChange,
}: Omit<Props, 'open'>) {
  const complete = useCompleteEnrollment(workspaceId)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await complete.mutateAsync({
        enrollmentId,
        score: score ? parseFloat(score) : null,
        feedback: feedback.trim() || null,
      })
      toast({ title: 'Enrollment marked as completed', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to complete enrollment', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Complete Enrollment</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ec-score">Score (0–100)</Label>
          <Input
            id="ec-score"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Optional score"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ec-feedback">Feedback</Label>
          <Input
            id="ec-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional feedback"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={complete.isPending}>
            {complete.isPending ? 'Saving…' : 'Mark Complete'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
