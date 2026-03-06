import { type Deal } from '../hooks/use-deals'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

interface Props {
  deal: Deal
  contactName?: string
}

export function DealCard({ deal, contactName }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <p className="text-sm font-medium truncate">{deal.title}</p>
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
