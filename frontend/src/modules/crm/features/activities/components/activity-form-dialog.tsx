import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Activity, ACTIVITY_TYPES, useCreateActivity, useUpdateActivity } from '../hooks/use-activities'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { useDeals } from '../../deals/hooks/use-deals'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  activity?: Activity | null
}

export function ActivityFormDialog({ open, onOpenChange, workspaceId, activity }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <ActivityFormContent workspaceId={workspaceId} activity={activity} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function ActivityFormContent({ workspaceId, activity, onOpenChange }: Omit<Props, 'open'>) {
  const createActivity = useCreateActivity(workspaceId)
  const updateActivity = useUpdateActivity(workspaceId)
  const { data: contactsData } = useContacts(workspaceId, { page_size: 100 })
  const { data: dealsData } = useDeals(workspaceId, { page_size: 100 })
  const isEdit = !!activity

  const [type, setType] = useState(activity?.type ?? 'call')
  const [subject, setSubject] = useState(activity?.subject ?? '')
  const [notes, setNotes] = useState(activity?.notes ?? '')
  const [date, setDate] = useState(activity?.date ? activity.date.slice(0, 16) : new Date().toISOString().slice(0, 16))
  const [contactId, setContactId] = useState(activity?.contact_id ?? 'none')
  const [dealId, setDealId] = useState(activity?.deal_id ?? 'none')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return
    try {
      const payload = {
        type,
        subject: subject.trim(),
        notes: notes.trim() || null,
        date: new Date(date).toISOString(),
        contact_id: contactId === 'none' ? null : contactId,
        deal_id: dealId === 'none' ? null : dealId,
      }
      if (isEdit) {
        await updateActivity.mutateAsync({ activityId: activity.id, ...payload })
        toast({ title: 'Activity updated', variant: 'success' })
      } else {
        await createActivity.mutateAsync(payload)
        toast({ title: 'Activity created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save activity', variant: 'error' })
    }
  }

  const pending = createActivity.isPending || updateActivity.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit activity' : 'New Activity'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-date">Date</Label>
            <Input id="act-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="act-subject">Subject *</Label>
          <Input id="act-subject" value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="act-notes">Notes</Label>
          <Input id="act-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder="No contact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {(contactsData?.items ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Deal</Label>
            <Select value={dealId} onValueChange={setDealId}>
              <SelectTrigger><SelectValue placeholder="No deal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No deal</SelectItem>
                {(dealsData?.items ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !subject.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save' : 'New Activity'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
