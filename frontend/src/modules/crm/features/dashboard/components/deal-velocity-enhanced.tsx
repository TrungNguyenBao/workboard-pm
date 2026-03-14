import { useVelocityDetail } from '../hooks/use-analytics-enhanced'

export function DealVelocityEnhanced() {
  const { data, isLoading } = useVelocityDetail()

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="h-4 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.total_closed_won === 0) {
    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium text-foreground mb-4">Deal Velocity by Owner</p>
        <p className="text-sm text-muted-foreground text-center py-8">No closed deals yet</p>
      </div>
    )
  }

  const maxDays = Math.max(...data.by_owner.map((o) => o.avg_days), 1)

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm font-medium text-foreground">Deal Velocity by Owner</p>
        <span className="text-xs text-muted-foreground">
          avg {data.overall_avg_days}d overall
        </span>
      </div>

      <div className="space-y-3">
        {data.by_owner.map((owner) => {
          const widthPct = (owner.avg_days / maxDays) * 100
          const isBottleneck = data.bottleneck?.owner_id === owner.owner_id
          return (
            <div key={owner.owner_id} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0 truncate">
                {owner.owner_id.slice(0, 8)}…
              </span>
              <div className="flex-1 h-7 bg-muted rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all flex items-center px-2 ${
                    isBottleneck ? 'bg-red-500' : 'bg-primary/70'
                  }`}
                  style={{ width: `${Math.max(widthPct, 4)}%` }}
                >
                  <span className="text-xs text-white font-medium truncate">
                    {owner.avg_days}d
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground w-12 shrink-0 text-right">
                {owner.deals_count} deals
              </span>
            </div>
          )
        })}
      </div>

      {data.bottleneck && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          <span className="text-red-500 font-medium">Red bar</span> = slowest owner
        </p>
      )}
    </div>
  )
}
