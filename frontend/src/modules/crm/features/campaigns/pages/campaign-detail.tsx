import { ArrowLeft, DollarSign, Users, TrendingUp, BarChart2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useCampaignStats } from '../hooks/use-campaign-stats'
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from '../hooks/use-campaigns'
import { CampaignMetrics } from '../components/campaign-metrics'

function formatCurrency(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

export default function CampaignDetailPage() {
  const { campaignId = '' } = useParams<{ campaignId: string }>()
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data, isLoading, isError } = useCampaignStats(wsId, campaignId)

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 sm:p-6">
        <Link to="/crm/campaigns" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Link>
        <p className="text-sm text-destructive">Failed to load campaign stats.</p>
      </div>
    )
  }

  const { campaign: c, total_leads, converted_leads, conversion_rate, won_deal_value, cost_per_lead, roi_percent } = data
  const typeLabel = CAMPAIGN_TYPES.find((t) => t.value === c.type)?.label ?? c.type
  const statusLabel = CAMPAIGN_STATUSES.find((s) => s.value === c.status)?.label ?? c.status

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/crm/campaigns" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-foreground truncate">{c.name}</h2>
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant={(c.status === 'active' ? 'success' : c.status === 'draft' ? 'secondary' : 'warning') as BadgeVariant}>
              {statusLabel}
            </Badge>
          </div>
          {(c.start_date || c.end_date) && (
            <p className="text-xs text-muted-foreground mt-1">
              {c.start_date ?? '—'} → {c.end_date ?? '—'}
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={total_leads} icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Cost per Lead" value={formatCurrency(cost_per_lead)} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard label="Conversion Rate" value={`${conversion_rate}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard
          label="ROI"
          value={`${roi_percent}%`}
          icon={<BarChart2 className="h-5 w-5" />}
          valueClassName={roi_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      {/* Campaign Metrics */}
      <CampaignMetrics workspaceId={wsId} campaignId={campaignId} />

      {/* Budget & Revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <p className="text-sm font-medium text-foreground">Budget vs Spend</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-lg font-semibold">{formatCurrency(c.budget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actual Cost</p>
              <p className="text-lg font-semibold">{formatCurrency(c.actual_cost)}</p>
            </div>
          </div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <p className="text-sm font-medium text-foreground">Lead Conversion</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <p className="text-lg font-semibold">{total_leads}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Converted</p>
              <p className="text-lg font-semibold">{converted_leads}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Won Deal Value</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(won_deal_value)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
