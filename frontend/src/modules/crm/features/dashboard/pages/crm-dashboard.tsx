import { Award, DollarSign, Target, TrendingUp, Users, Users2, Activity, Ticket } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { useCrmStats } from '../hooks/use-crm-stats'

const STAGE_COLORS: Record<string, string> = {
  Lead: '#A1A1AA',
  Qualified: '#38BDF8',
  Proposal: '#818CF8',
  Negotiation: '#F59E0B',
  'Closed Won': '#22C55E',
  'Closed Lost': '#EF4444',
}

const SOURCE_COLORS = ['#38BDF8', '#818CF8', '#F59E0B', '#22C55E', '#EF4444', '#A1A1AA']

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value}`
}

export default function CrmDashboardPage() {
  const { stats, stageBars, leadSourceBars, isLoading } = useCrmStats()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
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
    <div className="p-6 space-y-6">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deals by Stage */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-4">Deals by Stage</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageBars} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageBars.map((entry, i) => (
                  <Cell key={i} fill={STAGE_COLORS[entry.name] ?? '#A1A1AA'} />
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
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Campaign Summary */}
      {(stats.totalCampaignBudget > 0 || stats.totalCampaignCost > 0) && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-2">Campaign Summary</p>
          <div className="grid grid-cols-3 gap-4">
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
