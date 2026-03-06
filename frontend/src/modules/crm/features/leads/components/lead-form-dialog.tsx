import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Lead, LEAD_SOURCES, LEAD_STATUSES, useCreateLead, useUpdateLead } from '../hooks/use-leads'
import { useCampaigns } from '../../campaigns/hooks/use-campaigns'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  lead?: Lead | null
}

export function LeadFormDialog({ open, onOpenChange, workspaceId, lead }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <LeadFormContent workspaceId={workspaceId} lead={lead} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function LeadFormContent({ workspaceId, lead, onOpenChange }: Omit<Props, 'open'>) {
  const createLead = useCreateLead(workspaceId)
  const updateLead = useUpdateLead(workspaceId)
  const { data: campaignsData } = useCampaigns(workspaceId, { page_size: 100 })
  const isEdit = !!lead

  const [name, setName] = useState(lead?.name ?? '')
  const [email, setEmail] = useState(lead?.email ?? '')
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [source, setSource] = useState(lead?.source ?? 'manual')
  const [status, setStatus] = useState(lead?.status ?? 'new')
  const [score, setScore] = useState(lead?.score?.toString() ?? '0')
  const [campaignId, setCampaignId] = useState(lead?.campaign_id ?? 'none')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        source,
        status,
        score: parseInt(score) || 0,
        campaign_id: campaignId === 'none' ? null : campaignId,
      }
      if (isEdit) {
        await updateLead.mutateAsync({ leadId: lead.id, ...payload })
        toast({ title: 'Lead updated', variant: 'success' })
      } else {
        await createLead.mutateAsync(payload)
        toast({ title: 'Lead created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save lead', variant: 'error' })
    }
  }

  const pending = createLead.isPending || updateLead.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit lead' : 'New Lead'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lead-name">Name *</Label>
          <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email</Label>
            <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">Phone</Label>
            <Input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-score">Score</Label>
            <Input id="lead-score" type="number" min="0" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger><SelectValue placeholder="No campaign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {(campaignsData?.items ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save' : 'New Lead'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
