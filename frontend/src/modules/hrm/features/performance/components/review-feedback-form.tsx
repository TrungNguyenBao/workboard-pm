import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreateReviewFeedback } from '../hooks/use-review-feedback'

const RELATIONSHIP_TYPES = ['self', 'manager', 'peer', 'subordinate'] as const
const SCORE_CATEGORIES = ['communication', 'teamwork', 'delivery', 'initiative', 'leadership']

interface Props {
  workspaceId: string
  reviewId: string
  onSuccess?: () => void
}

export function ReviewFeedbackForm({ workspaceId, reviewId, onSuccess }: Props) {
  const create = useCreateReviewFeedback(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })

  const [fromEmployeeId, setFromEmployeeId] = useState('')
  const [relationship, setRelationship] = useState('')
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(SCORE_CATEGORIES.map((k) => [k, '']))
  )
  const [comments, setComments] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromEmployeeId || !relationship) return
    const parsedScores: Record<string, number> = {}
    for (const [k, v] of Object.entries(scores)) {
      if (v !== '') parsedScores[k] = parseInt(v)
    }
    try {
      await create.mutateAsync({
        review_id: reviewId,
        from_employee_id: fromEmployeeId,
        relationship_type: relationship,
        scores: Object.keys(parsedScores).length > 0 ? parsedScores : null,
        comments: comments.trim() || null,
      })
      toast({ title: 'Feedback submitted', variant: 'success' })
      onSuccess?.()
    } catch {
      toast({ title: 'Failed to submit feedback', variant: 'error' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-neutral-50/50">
      <p className="text-sm font-medium">Add Feedback</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>From *</Label>
          <Select value={fromEmployeeId} onValueChange={setFromEmployeeId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {(employeesData?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Relationship *</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TYPES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Scores (1–5)</Label>
        <div className="grid grid-cols-3 gap-2">
          {SCORE_CATEGORIES.map((cat) => (
            <div key={cat} className="space-y-1">
              <Label htmlFor={`score-${cat}`} className="text-xs capitalize">{cat}</Label>
              <Input
                id={`score-${cat}`}
                type="number" min="1" max="5"
                className="h-7 text-xs"
                value={scores[cat]}
                onChange={(e) => setScores((prev) => ({ ...prev, [cat]: e.target.value }))}
                placeholder="–"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fb-comments">Comments</Label>
        <Input id="fb-comments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Optional comments" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={create.isPending || !fromEmployeeId || !relationship}>
          {create.isPending ? 'Submitting…' : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  )
}
