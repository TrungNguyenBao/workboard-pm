import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { type GovernanceAlerts } from '../hooks/use-governance-alerts'

interface Props {
  alerts: GovernanceAlerts
}

export function StaleDealsAlert({ alerts }: Props) {
  const total = alerts.stale_deals_count + alerts.stale_leads_count
    + alerts.unassigned_leads + alerts.overdue_tickets
  if (total === 0) return null

  return (
    <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-sm font-medium text-foreground">Governance Alerts</p>
        <Badge variant="secondary" className="ml-auto">{total}</Badge>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <AlertStat label="Stale Deals" count={alerts.stale_deals_count} />
        <AlertStat label="Stale Leads" count={alerts.stale_leads_count} />
        <AlertStat label="Unassigned Leads" count={alerts.unassigned_leads} />
        <AlertStat label="Overdue Tickets" count={alerts.overdue_tickets} />
      </div>
      {alerts.stale_deals.length > 0 && (
        <div className="mt-3 space-y-1">
          {alerts.stale_deals.slice(0, 5).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-xs px-1">
              <span className="truncate">{d.title}</span>
              <Badge variant="secondary" className="text-xs ml-2">{d.stage}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AlertStat({ label, count }: { label: string; count: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{count}</p>
    </div>
  )
}
