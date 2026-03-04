import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useCreateOffer } from '../hooks/use-offers'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  candidateId: string
}

export function OfferFormDialog({ open, onOpenChange, workspaceId, candidateId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <FormContent workspaceId={workspaceId} candidateId={candidateId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function FormContent({ workspaceId, candidateId, onOpenChange }: Omit<Props, 'open'>) {
  const createOffer = useCreateOffer(workspaceId)

  const [positionTitle, setPositionTitle] = useState('')
  const [offeredSalary, setOfferedSalary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!positionTitle || !offeredSalary || !startDate) return
    try {
      await createOffer.mutateAsync({
        candidate_id: candidateId,
        position_title: positionTitle,
        offered_salary: parseFloat(offeredSalary),
        start_date: startDate,
        expiry_date: expiryDate || null,
        notes: notes || null,
      })
      toast({ title: 'Offer created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create offer', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create Offer</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="of-title">Position Title *</Label>
          <Input id="of-title" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} placeholder="e.g. Senior Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="of-salary">Offered Salary *</Label>
          <Input id="of-salary" type="number" min="0" step="0.01" value={offeredSalary} onChange={(e) => setOfferedSalary(e.target.value)} placeholder="0.00" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="of-start">Start Date *</Label>
            <Input id="of-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="of-expiry">Expiry Date</Label>
            <Input id="of-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="of-notes">Notes</Label>
          <textarea
            id="of-notes"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-ring"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createOffer.isPending || !positionTitle || !offeredSalary || !startDate}>
            {createOffer.isPending ? 'Creating...' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
