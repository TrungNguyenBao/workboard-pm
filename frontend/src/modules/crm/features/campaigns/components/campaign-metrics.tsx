import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react'
import api from '@/shared/lib/api'

interface CampaignMetrics {
  revenue: number
  roi_pct: number
  cost_per_lead: number
  lead_count: number
  won_count: number
  actual_cost: number
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
}

function MetricCard({ icon, label, value, sub }: MetricCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

interface Props {
  workspaceId: string
  campaignId: string
}

export function CampaignMetrics({ workspaceId, campaignId }: Props) {
  const { data, isLoading } = useQuery<CampaignMetrics>({
    queryKey: ['crm-campaign-metrics', workspaceId, campaignId],
    queryFn: () =>
      api
        .get(`/crm/workspaces/${workspaceId}/campaigns/${campaignId}/metrics`)
        .then((r) => r.data),
    enabled: !!workspaceId && !!campaignId,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const roiColor = data.roi_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="ROI"
        value={<span className={roiColor}>{data.roi_pct > 0 ? '+' : ''}{data.roi_pct}%</span>}
        sub={`Cost: ${formatCurrency(data.actual_cost)}`}
      />
      <MetricCard
        icon={<DollarSign className="h-3.5 w-3.5" />}
        label="Revenue"
        value={formatCurrency(data.revenue)}
        sub={`${data.won_count} won deal${data.won_count !== 1 ? 's' : ''}`}
      />
      <MetricCard
        icon={<Users className="h-3.5 w-3.5" />}
        label="Leads"
        value={String(data.lead_count)}
        sub="total generated"
      />
      <MetricCard
        icon={<Award className="h-3.5 w-3.5" />}
        label="Cost per Lead"
        value={formatCurrency(data.cost_per_lead)}
        sub="avg. acquisition cost"
      />
    </div>
  )
}
