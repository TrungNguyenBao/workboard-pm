import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { toast } from '@/shared/components/ui/toast'
import { type Lead, useConvertLead } from '../hooks/use-leads'

interface Props {
  lead: Lead | null
  onClose: () => void
  workspaceId: string
}

export function LeadConvertDialog({ lead, onClose, workspaceId }: Props) {
  const convertLead = useConvertLead(workspaceId)

  if (!lead) return null

  async function handleConvert() {
    if (!lead) return
    try {
      await convertLead.mutateAsync(lead.id)
      toast({ title: `Lead "${lead.name}" converted to opportunity`, variant: 'success' })
      onClose()
    } catch {
      toast({ title: 'Failed to convert lead', variant: 'error' })
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convert Lead</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Convert <strong>{lead.name}</strong> to an opportunity? This will create a new deal and mark the lead as &quot;opportunity&quot;.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConvert} disabled={convertLead.isPending}>
            {convertLead.isPending ? 'Converting...' : 'Convert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
