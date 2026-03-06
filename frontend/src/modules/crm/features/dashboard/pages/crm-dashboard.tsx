import { Award, DollarSign, Users, Users2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
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

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value}`
}

export default function CrmDashboardPage() {
  const { stats, stageBars, isLoading } = useCrmStats()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contacts" value={stats.totalContacts} icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Deals" value={stats.totalDeals} icon={<Users2 className="h-5 w-5" />} />
        <KpiCard label="Pipeline Value" value={formatCurrency(stats.pipelineValue)} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard label="Deals Won" value={stats.dealsWon} icon={<Award className="h-5 w-5" />} />
      </div>

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
    </div>
  )
}
