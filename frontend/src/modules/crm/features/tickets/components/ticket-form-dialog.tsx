import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Ticket, TICKET_PRIORITIES, TICKET_STATUSES, useCreateTicket, useUpdateTicket } from '../hooks/use-tickets'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { useAccounts } from '../../accounts/hooks/use-accounts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  ticket?: Ticket | null
}

export function TicketFormDialog({ open, onOpenChange, workspaceId, ticket }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <TicketFormContent workspaceId={workspaceId} ticket={ticket} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function TicketFormContent({ workspaceId, ticket, onOpenChange }: Omit<Props, 'open'>) {
  const createTicket = useCreateTicket(workspaceId)
  const updateTicket = useUpdateTicket(workspaceId)
  const { data: contactsData } = useContacts(workspaceId, { page_size: 100 })
  const { data: accountsData } = useAccounts(workspaceId, { page_size: 100 })
  const isEdit = !!ticket

  const [subject, setSubject] = useState(ticket?.subject ?? '')
  const [description, setDescription] = useState(ticket?.description ?? '')
  const [priority, setPriority] = useState(ticket?.priority ?? 'medium')
  const [status, setStatus] = useState(ticket?.status ?? 'open')
  const [resolutionNotes, setResolutionNotes] = useState(ticket?.resolution_notes ?? '')
  const [contactId, setContactId] = useState(ticket?.contact_id ?? 'none')
  const [accountId, setAccountId] = useState(ticket?.account_id ?? 'none')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return
    try {
      const payload = {
        subject: subject.trim(),
        description: description.trim() || null,
        priority,
        status,
        resolution_notes: (status === 'resolved' || status === 'closed') ? (resolutionNotes.trim() || null) : undefined,
        contact_id: contactId === 'none' ? null : contactId,
        account_id: accountId === 'none' ? null : accountId,
      }
      if (isEdit) {
        await updateTicket.mutateAsync({ ticketId: ticket.id, ...payload })
        toast({ title: 'Ticket updated', variant: 'success' })
      } else {
        await createTicket.mutateAsync(payload)
        toast({ title: 'Ticket created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save ticket', variant: 'error' })
    }
  }

  const pending = createTicket.isPending || updateTicket.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit ticket' : 'New Ticket'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ticket-subject">Subject *</Label>
          <Input id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-desc">Description</Label>
          <Input id="ticket-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TICKET_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TICKET_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(status === 'resolved' || status === 'closed') && (
          <div className="space-y-1.5">
            <Label htmlFor="ticket-resolution">Resolution Notes</Label>
            <Input id="ticket-resolution" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="How was this resolved?" />
          </div>
        )}
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
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {(accountsData?.items ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !subject.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save' : 'New Ticket'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
