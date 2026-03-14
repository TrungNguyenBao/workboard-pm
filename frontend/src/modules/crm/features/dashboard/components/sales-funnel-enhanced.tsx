import { useFunnelConversion } from '../hooks/use-analytics-enhanced'

interface FunnelStage {
  label: string
  count: number
  conversionPct: number | null
}

export function SalesFunnelEnhanced() {
  const { data, isLoading } = useFunnelConversion()

  const stages: FunnelStage[] = data
    ? [
        { label: 'Total Leads', count: data.total_leads, conversionPct: null },
        {
          label: 'Qualified',
          count: data.qualified,
          conversionPct: data.lead_to_qualified_pct,
        },
        {
          label: 'Opportunity',
          count: data.opportunity,
          conversionPct: data.qualified_to_opportunity_pct,
        },
        {
          label: 'Closed Won',
          count: data.closed_won,
          conversionPct: data.opportunity_to_closed_pct,
        },
      ]
    : []

  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-foreground">Sales Funnel</p>
        {data && (
          <span className="text-xs text-muted-foreground">
            Overall {data.overall_conversion_pct}% conversion
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No funnel data yet</p>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const widthPct = (stage.count / maxCount) * 100
            const colors = [
              'bg-blue-500',
              'bg-indigo-500',
              'bg-violet-500',
              'bg-green-500',
            ]
            return (
              <div key={stage.label}>
                {stage.conversionPct !== null && (
                  <div className="flex justify-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      ↓ {stage.conversionPct}%
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                    {stage.label}
                  </span>
                  <div className="flex-1 h-7 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full ${colors[i]} rounded transition-all flex items-center px-2`}
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                    >
                      <span className="text-xs text-white font-medium truncate">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
