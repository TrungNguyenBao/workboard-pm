import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

interface RevenuePoint {
  month: string
  revenue: number
}

function useAccountRevenueByMonth(workspaceId: string, accountId: string, months = 12) {
  return useQuery<RevenuePoint[]>({
    queryKey: ['crm-account-revenue', workspaceId, accountId, months],
    queryFn: () =>
      api
        .get(`/crm/workspaces/${workspaceId}/accounts/${accountId}/revenue-by-month`, {
          params: { months },
        })
        .then((r) => r.data),
    enabled: !!workspaceId && !!accountId,
  })
}

interface Props {
  workspaceId: string
  accountId: string
  months?: number
}

export function AccountRevenueChart({ workspaceId, accountId, months = 12 }: Props) {
  const { data = [], isLoading } = useAccountRevenueByMonth(workspaceId, accountId, months)

  if (isLoading) {
    return <div className="h-40 bg-muted animate-pulse rounded-lg" />
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No closed-won revenue in the last {months} months.
      </p>
    )
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  function formatShort(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Revenue by Month (Closed Won)</p>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((point) => {
          const heightPct = (point.revenue / maxRevenue) * 100
          return (
            <div
              key={point.month}
              className="flex flex-col items-center gap-1 flex-1 min-w-0"
              title={`${point.month}: ${formatShort(point.revenue)}`}
            >
              <span className="text-[10px] text-muted-foreground truncate">
                {formatShort(point.revenue)}
              </span>
              <div className="w-full bg-muted rounded-t overflow-hidden" style={{ height: '80px' }}>
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{ height: `${heightPct}%`, marginTop: 'auto' }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {point.month.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
