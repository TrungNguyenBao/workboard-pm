import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type PurchaseRequest, useCreatePurchaseRequest, useUpdatePurchaseRequest } from '../hooks/use-purchase-requests'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  request?: PurchaseRequest | null
}

export function PurchaseRequestFormDialog({ open, onOpenChange, workspaceId, request }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <PRFormContent workspaceId={workspaceId} request={request} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function PRFormContent({ workspaceId, request, onOpenChange }: Omit<Props, 'open'>) {
  const isEdit = !!request
  const createPR = useCreatePurchaseRequest(workspaceId)
  const updatePR = useUpdatePurchaseRequest(workspaceId)

  const [title, setTitle] = useState(request?.title ?? '')
  const [description, setDescription] = useState(request?.description ?? '')
  const [estimatedTotal, setEstimatedTotal] = useState(request?.estimated_total?.toString() ?? '0')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const payload = {
        title: title.trim(),
        description: description || null,
        estimated_total: parseFloat(estimatedTotal) || 0,
      }
      if (isEdit) {
        await updatePR.mutateAsync({ prId: request.id, ...payload })
        toast({ title: 'Purchase request updated', variant: 'success' })
      } else {
        await createPR.mutateAsync(payload)
        toast({ title: 'Purchase request created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save purchase request', variant: 'error' })
    }
  }

  const pending = createPR.isPending || updatePR.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Purchase Request' : 'New Purchase Request'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pr-title">Title *</Label>
          <Input
            id="pr-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Office supplies Q2"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pr-desc">Description</Label>
          <textarea
            id="pr-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about this purchase..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pr-total">Estimated Total</Label>
          <Input
            id="pr-total"
            type="number"
            min="0"
            step="0.01"
            value={estimatedTotal}
            onChange={(e) => setEstimatedTotal(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
