import { Award, DollarSign, Target, TrendingUp, Users, Users2, Activity, Ticket } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE } from '@/shared/lib/chart-colors'
import { useCrmStats } from '../hooks/use-crm-stats'
import { useGovernanceAlerts } from '../hooks/use-governance-alerts'
import { StaleDealsAlert } from '../components/stale-deals-alert'
import { StaleLeadsAlert } from '../components/stale-leads-alert'
import { FollowUpsDueWidget } from '../components/follow-ups-due-widget'
import { RevenueTrendChart } from '../components/revenue-trend-chart'
import { SalesFunnelEnhanced } from '../components/sales-funnel-enhanced'
import { DealVelocityEnhanced } from '../components/deal-velocity-enhanced'

const STAGE_COLORS: Record<string, string> = {
  Lead: CHART_COLORS.muted,
  Qualified: CHART_COLORS.info,
  'Needs Analysis': CHART_COLORS.primary,
  Proposal: CHART_COLORS.primaryLight,
  Negotiation: CHART_COLORS.warning,
  'Closed Won': CHART_COLORS.success,
  'Closed Lost': CHART_COLORS.danger,
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value}`
}

export default function CrmDashboardPage() {
  const { stats, stageBars, leadSourceBars, isLoading } = useCrmStats()
  const { data: govAlerts } = useGovernanceAlerts()
  // govAlerts may be undefined for non-admin users (403) — handled gracefully

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Leads" value={stats.totalLeads} icon={<Target className="h-5 w-5" />} />
        <KpiCard label="Contacts" value={stats.totalContacts} icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Deals" value={stats.totalDeals} icon={<Users2 className="h-5 w-5" />} />
        <KpiCard label="Pipeline Value" value={formatCurrency(stats.pipelineValue)} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard label="Deals Won" value={stats.dealsWon} icon={<Award className="h-5 w-5" />} />
        <KpiCard label="Win Rate" value={`${stats.winRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Lead Conversion" value={`${stats.leadConversionRate}%`} icon={<Activity className="h-5 w-5" />} />
        <KpiCard label="Open Tickets" value={stats.openTickets} icon={<Ticket className="h-5 w-5" />} />
      </div>

      {/* Governance Alerts */}
      {govAlerts && <StaleDealsAlert alerts={govAlerts} />}

      {/* Stale Leads */}
      <StaleLeadsAlert />

      {/* Follow-ups Due */}
      <FollowUpsDueWidget />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deals by Stage */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-4">Deals by Stage</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageBars} barSize={36}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="name" tick={{ ...CHART_AXIS_STYLE, fontSize: 10 }} />
              <YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageBars.map((entry, i) => (
                  <Cell key={i} fill={STAGE_COLORS[entry.name] ?? CHART_COLORS.muted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-4">Lead Sources</p>
          {leadSourceBars.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No lead data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={leadSourceBars}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {leadSourceBars.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS.series[i % CHART_COLORS.series.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue Trend */}
      <RevenueTrendChart />

      {/* Funnel + Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesFunnelEnhanced />
        <DealVelocityEnhanced />
      </div>

      {/* Campaign Summary */}
      {(stats.totalCampaignBudget > 0 || stats.totalCampaignCost > 0) && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-2">Campaign Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-lg font-semibold">{formatCurrency(stats.totalCampaignBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actual Cost</p>
              <p className="text-lg font-semibold">{formatCurrency(stats.totalCampaignCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activities</p>
              <p className="text-lg font-semibold">{stats.totalActivities}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
