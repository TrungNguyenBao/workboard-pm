import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useDeal } from '../hooks/use-deal-detail'
import { useDealContacts, DEAL_CONTACT_ROLES } from '../hooks/use-deal-contacts'
import { DealCompetitorsTab } from '../components/deal-competitors-tab'
import { DealQuotationsTab } from '../components/deal-quotations-tab'

type Tab = 'overview' | 'contacts' | 'competitors' | 'quotations'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'quotations', label: 'Quotations' },
]

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v)
}

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: deal, isLoading } = useDeal(workspaceId, dealId ?? '')
  const [tab, setTab] = useState<Tab>('overview')

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!deal) return <div className="p-6 text-muted-foreground">Deal not found</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/deals')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{deal.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary">{deal.stage}</Badge>
            <span className="text-sm text-muted-foreground">{formatCurrency(deal.value)}</span>
            {deal.probability > 0 && (
              <span className="text-xs text-muted-foreground">{deal.probability}% probability</span>
            )}
          </div>
        </div>
      </div>

      {/* Activity governance warning */}
      {deal.warning && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {deal.warning}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-3 text-sm max-w-lg">
          <InfoRow label="Stage" value={deal.stage} />
          <InfoRow label="Value" value={formatCurrency(deal.value)} />
          <InfoRow label="Probability" value={`${deal.probability}%`} />
          <InfoRow label="Expected Close" value={deal.expected_close_date ?? '-'} />
          <InfoRow
            label="Last Activity"
            value={
              deal.last_activity_date
                ? new Date(deal.last_activity_date).toLocaleDateString()
                : '-'
            }
          />
          {deal.loss_reason && <InfoRow label="Loss Reason" value={deal.loss_reason} />}
          <InfoRow label="Created" value={new Date(deal.created_at).toLocaleDateString()} />
        </div>
      )}

      {tab === 'contacts' && (
        <DealContactsTab workspaceId={workspaceId} dealId={deal.id} />
      )}

      {tab === 'competitors' && (
        <DealCompetitorsTab workspaceId={workspaceId} dealId={deal.id} />
      )}

      {tab === 'quotations' && (
        <DealQuotationsTab workspaceId={workspaceId} dealId={deal.id} />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="w-32 text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function DealContactsTab({
  workspaceId,
  dealId,
}: {
  workspaceId: string
  dealId: string
}) {
  const { data: roles = [], isLoading } = useDealContacts(workspaceId, dealId)

  if (isLoading) return <div className="h-20 bg-muted animate-pulse rounded-lg" />
  if (roles.length === 0)
    return <p className="text-sm text-muted-foreground py-4">No contacts linked to this deal.</p>

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card divide-y divide-border">
      {roles.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-2 px-3">
          <span className="text-sm font-medium text-muted-foreground">{r.contact_id}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {DEAL_CONTACT_ROLES.find((x) => x.value === r.role)?.label ?? r.role}
            </Badge>
            {r.is_primary && (
              <span className="text-xs text-primary font-medium">Primary</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
