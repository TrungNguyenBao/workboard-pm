import type { SalesForecast } from '../hooks/use-forecasts'

interface Props {
  forecasts: SalesForecast[]
  onClose?: (id: string) => void
}

function AttainmentBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100)
  const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
    </div>
  )
}

function fmt(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

export function ForecastTable({ forecasts, onClose }: Props) {
  if (forecasts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-12">
        No forecasts found for this period.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4">Owner</th>
            <th className="pb-2 pr-4">Period</th>
            <th className="pb-2 pr-4 text-right">Target</th>
            <th className="pb-2 pr-4 text-right">Committed</th>
            <th className="pb-2 pr-4 text-right">Best Case</th>
            <th className="pb-2 pr-4 text-right">Closed</th>
            <th className="pb-2 pr-4 min-w-32">Attainment</th>
            <th className="pb-2">Status</th>
            {onClose && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody>
          {forecasts.map((f) => {
            const attainment = f.target_amount > 0
              ? (f.closed_amount / f.target_amount) * 100
              : 0
            return (
              <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                  {f.owner_id.slice(0, 8)}…
                </td>
                <td className="py-2 pr-4">{f.period}</td>
                <td className="py-2 pr-4 text-right font-medium">{fmt(f.target_amount)}</td>
                <td className="py-2 pr-4 text-right">{fmt(f.committed_amount)}</td>
                <td className="py-2 pr-4 text-right">{fmt(f.best_case_amount)}</td>
                <td className="py-2 pr-4 text-right text-green-600 font-medium">
                  {fmt(f.closed_amount)}
                </td>
                <td className="py-2 pr-4">
                  <AttainmentBar pct={attainment} />
                </td>
                <td className="py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      f.status === 'closed'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {f.status}
                  </span>
                </td>
                {onClose && (
                  <td className="py-2 pl-2">
                    {f.status === 'open' && (
                      <button
                        onClick={() => onClose(f.id)}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Close
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
