import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type Lead, useConvertLead } from '../hooks/use-leads'

interface Props {
  lead: Lead | null
  onClose: () => void
  workspaceId: string
}

export function LeadConvertDialog({ lead, onClose, workspaceId }: Props) {
  const convertLead = useConvertLead(workspaceId)

  const [dealTitle, setDealTitle] = useState(lead ? `${lead.name} - Deal` : '')
  const [value, setValue] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [createContact, setCreateContact] = useState(true)

  if (!lead) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lead) return
    try {
      await convertLead.mutateAsync({
        leadId: lead.id,
        deal_title: dealTitle.trim() || undefined,
        value: value ? parseFloat(value) : undefined,
        expected_close_date: closeDate || undefined,
        create_contact: createContact,
      })
      toast({ title: `Lead "${lead.name}" converted to opportunity`, variant: 'success' })
      onClose()
    } catch {
      toast({ title: 'Failed to convert lead', variant: 'error' })
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Lead to Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label htmlFor="deal-title">Deal Title</Label>
            <Input
              id="deal-title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder={`${lead.name} - Deal`}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="deal-value">Value</Label>
            <Input
              id="deal-value"
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="close-date">Expected Close Date</Label>
            <Input
              id="close-date"
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={createContact}
              onChange={(e) => setCreateContact(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Auto-create contact from lead info
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={convertLead.isPending}>
              {convertLead.isPending ? 'Converting...' : 'Convert to Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
