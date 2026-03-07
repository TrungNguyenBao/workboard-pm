import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { toast } from '@/shared/components/ui/toast'
import { useDistributeLeads } from '../hooks/use-leads'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function LeadDistributeDialog({ open, onOpenChange, workspaceId }: Props) {
  const distribute = useDistributeLeads(workspaceId)

  async function handleDistribute() {
    try {
      const result = await distribute.mutateAsync()
      toast({
        title: `Distributed ${result.distributed_count} leads`,
        variant: 'success',
      })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to distribute leads', variant: 'error' })
    }
  }

  if (!open) return null

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Distribute Leads</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Assign all unassigned leads to team members via round-robin distribution.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDistribute} disabled={distribute.isPending}>
            {distribute.isPending ? 'Distributing...' : 'Distribute'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
