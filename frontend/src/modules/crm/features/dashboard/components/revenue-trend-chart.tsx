import { useRevenueTrend } from '../hooks/use-analytics-enhanced'

function fmt(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

export function RevenueTrendChart() {
  const { data: trend = [], isLoading } = useRevenueTrend(6)

  const max = Math.max(...trend.map((t) => t.revenue), 1)

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <p className="text-sm font-medium text-foreground mb-4">Monthly Revenue (last 6 months)</p>

      {isLoading ? (
        <div className="h-36 bg-muted animate-pulse rounded" />
      ) : (
        <div className="flex items-end gap-2 h-36">
          {trend.map((item) => {
            const heightPct = max > 0 ? (item.revenue / max) * 100 : 0
            const label = item.month.slice(5) // MM part
            return (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-xs text-muted-foreground">{fmt(item.revenue)}</span>
                <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={`${item.month}: ${fmt(item.revenue)}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && trend.every((t) => t.revenue === 0) && (
        <p className="text-xs text-muted-foreground text-center mt-2">No closed revenue yet</p>
      )}
    </div>
  )
}
