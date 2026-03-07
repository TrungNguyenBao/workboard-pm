import { AlertTriangle } from 'lucide-react'
import { type Deal } from '../hooks/use-deals'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function isStale(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return true
  const diff = Date.now() - new Date(lastActivityDate).getTime()
  return diff > 30 * 24 * 60 * 60 * 1000
}

interface Props {
  deal: Deal
  contactName?: string
}

export function DealCard({ deal, contactName }: Props) {
  const stale = !deal.stage.startsWith('closed_') && isStale(deal.last_activity_date)
  return (
    <div className={`rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${stale ? 'border-amber-500' : 'border-border'}`}>
      <div className="flex items-center gap-1">
        {stale && <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />}
        <p className="text-sm font-medium truncate">{deal.title}</p>
      </div>
      <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(deal.value)}</p>
      {contactName && <p className="text-xs text-muted-foreground mt-1">{contactName}</p>}
      {deal.probability > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
            <span>Probability</span>
            <span>{deal.probability}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(deal.probability, 100)}%` }} />
          </div>
        </div>
      )}
      {deal.expected_close_date && (
        <p className="text-xs text-muted-foreground mt-1">Close: {deal.expected_close_date}</p>
      )}
    </div>
  )
}
