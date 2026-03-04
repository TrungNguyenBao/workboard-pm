import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useCreateCandidate } from '../hooks/use-candidates'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  recruitmentRequestId: string
}

export function CandidateFormDialog({ open, onOpenChange, workspaceId, recruitmentRequestId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <FormContent
        workspaceId={workspaceId}
        recruitmentRequestId={recruitmentRequestId}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  )
}

function FormContent({
  workspaceId,
  recruitmentRequestId,
  onOpenChange,
}: Omit<Props, 'open'>) {
  const createCandidate = useCreateCandidate(workspaceId)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return
    try {
      await createCandidate.mutateAsync({
        recruitment_request_id: recruitmentRequestId,
        name,
        email,
        phone: phone || null,
        resume_url: resumeUrl || null,
        notes: notes || null,
      })
      toast({ title: 'Candidate added', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to add candidate', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add Candidate</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name *</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email *</Label>
          <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="candidate@example.com" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Phone</Label>
            <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-resume">Resume URL</Label>
            <Input id="c-resume" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-notes">Notes</Label>
          <textarea
            id="c-notes"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-ring"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createCandidate.isPending || !name || !email}>
            {createCandidate.isPending ? 'Adding...' : 'Add Candidate'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
