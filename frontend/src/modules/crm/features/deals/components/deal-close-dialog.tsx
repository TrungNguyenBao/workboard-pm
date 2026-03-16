import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useCloseDeal } from '../hooks/use-deals'

interface Props {
  dealId: string
  dealTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function DealCloseDialog({ dealId, dealTitle, open, onOpenChange, workspaceId }: Props) {
  const closeDeal = useCloseDeal(workspaceId)
  const [lossReason, setLossReason] = useState('')
  const [mode, setMode] = useState<'choose' | 'lost'>('choose')

  async function handleClose(action: 'won' | 'lost') {
    if (action === 'lost' && mode === 'choose') {
      setMode('lost')
      return
    }
    if (action === 'lost' && !lossReason.trim()) return
    try {
      await closeDeal.mutateAsync({
        dealId,
        action,
        loss_reason: action === 'lost' ? lossReason.trim() : undefined,
      })
      toast({ title: action === 'won' ? 'Deal closed as won!' : 'Deal closed as lost', variant: 'success' })
      onOpenChange(false)
      setMode('choose')
      setLossReason('')
    } catch {
      toast({ title: 'Failed to close deal', variant: 'error' })
    }
  }

  if (!open) return null

  return (
    <Dialog open onOpenChange={(v) => { onOpenChange(v); if (!v) { setMode('choose'); setLossReason('') } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Close Deal: {dealTitle}</DialogTitle>
        </DialogHeader>
        {mode === 'choose' ? (
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => handleClose('won')} disabled={closeDeal.isPending}>
              Mark as Won
            </Button>
            <Button variant="danger" onClick={() => handleClose('lost')} disabled={closeDeal.isPending}>
              Mark as Lost
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="loss-reason">Loss Reason *</Label>
              <Input
                id="loss-reason"
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="e.g. Competitor won, Budget cut..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode('choose')}>Back</Button>
              <Button
                variant="danger"
                onClick={() => handleClose('lost')}
                disabled={closeDeal.isPending || !lossReason.trim()}
              >
                {closeDeal.isPending ? 'Closing...' : 'Confirm Lost'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
