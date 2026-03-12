import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, Ticket, AlertTriangle } from 'lucide-react'
import api from '@/shared/lib/api'

interface TicketStats {
  total: number
  open_count: number
  resolved_count: number
  avg_resolution_hours: number
  resolution_rate: number
  by_priority: Record<string, number>
}

function useTicketStats(workspaceId: string) {
  return useQuery<TicketStats>({
    queryKey: ['crm-ticket-stats', workspaceId],
    queryFn: () =>
      api.get(`/crm/workspaces/${workspaceId}/tickets/stats`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  )
}

interface Props {
  workspaceId: string
}

export function TicketKpiCards({ workspaceId }: Props) {
  const { data, isLoading } = useTicketStats(workspaceId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const avgLabel = data.avg_resolution_hours >= 24
    ? `${(data.avg_resolution_hours / 24).toFixed(1)}d avg`
    : `${data.avg_resolution_hours}h avg`

  const criticalCount = data.by_priority['critical'] ?? 0
  const highCount = data.by_priority['high'] ?? 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <StatCard
        icon={<Ticket className="h-4 w-4" />}
        label="Open Tickets"
        value={data.open_count}
        sub={`${data.total} total`}
      />
      <StatCard
        icon={<CheckCircle className="h-4 w-4" />}
        label="Resolution Rate"
        value={`${data.resolution_rate}%`}
        sub={`${data.resolved_count} resolved`}
      />
      <StatCard
        icon={<Clock className="h-4 w-4" />}
        label="Avg Resolution"
        value={avgLabel}
        sub="time to resolve"
      />
      <StatCard
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Critical / High"
        value={`${criticalCount} / ${highCount}`}
        sub="by priority"
      />
    </div>
  )
}
