import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Campaign, CAMPAIGN_TYPES, CAMPAIGN_STATUSES, useCreateCampaign, useUpdateCampaign } from '../hooks/use-campaigns'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  campaign?: Campaign | null
}

export function CampaignFormDialog({ open, onOpenChange, workspaceId, campaign }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <CampaignFormContent workspaceId={workspaceId} campaign={campaign} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function CampaignFormContent({ workspaceId, campaign, onOpenChange }: Omit<Props, 'open'>) {
  const createCampaign = useCreateCampaign(workspaceId)
  const updateCampaign = useUpdateCampaign(workspaceId)
  const isEdit = !!campaign

  const [name, setName] = useState(campaign?.name ?? '')
  const [type, setType] = useState(campaign?.type ?? 'email')
  const [budget, setBudget] = useState(campaign?.budget?.toString() ?? '0')
  const [actualCost, setActualCost] = useState(campaign?.actual_cost?.toString() ?? '0')
  const [startDate, setStartDate] = useState(campaign?.start_date ?? '')
  const [endDate, setEndDate] = useState(campaign?.end_date ?? '')
  const [status, setStatus] = useState(campaign?.status ?? 'draft')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        type,
        budget: parseFloat(budget) || 0,
        actual_cost: parseFloat(actualCost) || 0,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      }
      if (isEdit) {
        await updateCampaign.mutateAsync({ campaignId: campaign.id, ...payload })
        toast({ title: 'Campaign updated', variant: 'success' })
      } else {
        await createCampaign.mutateAsync(payload)
        toast({ title: 'Campaign created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save campaign', variant: 'error' })
    }
  }

  const pending = createCampaign.isPending || updateCampaign.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit campaign' : 'New Campaign'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="camp-name">Name *</Label>
          <Input id="camp-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMPAIGN_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="camp-budget">Budget</Label>
            <Input id="camp-budget" type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="camp-cost">Actual Cost</Label>
            <Input id="camp-cost" type="number" min="0" step="0.01" value={actualCost} onChange={(e) => setActualCost(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="camp-start">Start Date</Label>
            <Input id="camp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="camp-end">End Date</Label>
            <Input id="camp-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save' : 'New Campaign'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
