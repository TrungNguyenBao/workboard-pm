import { useState } from 'react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/ui/toast'
import {
  useQuotationsByDeal,
  useSendQuotation,
  useAcceptQuotation,
  useRejectQuotation,
  type Quotation,
} from '../hooks/use-quotations'
import { QuotationFormDialog } from './quotation-form-dialog'

interface Props {
  workspaceId: string
  dealId: string
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'success' | 'danger' | 'warning'> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function QuotationRow({
  q,
  workspaceId,
  dealId,
}: {
  q: Quotation
  workspaceId: string
  dealId: string
}) {
  const send = useSendQuotation(workspaceId)
  const accept = useAcceptQuotation(workspaceId)
  const reject = useRejectQuotation(workspaceId)

  async function handleAction(action: 'send' | 'accept' | 'reject') {
    try {
      if (action === 'send') await send.mutateAsync({ quotationId: q.id, dealId })
      else if (action === 'accept') await accept.mutateAsync({ quotationId: q.id, dealId })
      else await reject.mutateAsync({ quotationId: q.id, dealId })
      toast({ title: `Quotation ${action}ed`, variant: 'success' })
    } catch {
      toast({ title: `Failed to ${action} quotation`, variant: 'error' })
    }
  }

  const busy = send.isPending || accept.isPending || reject.isPending

  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-sm font-medium">{q.quote_number}</span>
        <Badge variant={STATUS_BADGE[q.status] ?? 'default'}>{q.status}</Badge>
        {q.valid_until && (
          <span className="text-xs text-muted-foreground">until {q.valid_until}</span>
        )}
        {q.discount_pct > 20 && (
          <Badge variant="warning" className="text-xs">Approval needed</Badge>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold tabular-nums">{fmt(q.total)}</span>
        <div className="flex gap-1">
          {q.status === 'draft' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => handleAction('send')}>
              Send
            </Button>
          )}
          {(q.status === 'sent' || q.status === 'draft') && (
            <>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => handleAction('accept')}>
                Accept
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => handleAction('reject')}>
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function DealQuotationsTab({ workspaceId, dealId }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const { data: quotations = [], isLoading } = useQuotationsByDeal(workspaceId, dealId)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Quotations ({quotations.length})
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + Create Quote
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && quotations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No quotations yet. Create one to get started.
        </p>
      )}

      <div className="space-y-2">
        {quotations.map((q) => (
          <QuotationRow key={q.id} q={q} workspaceId={workspaceId} dealId={dealId} />
        ))}
      </div>

      <QuotationFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        workspaceId={workspaceId}
        dealId={dealId}
      />
    </div>
  )
}
