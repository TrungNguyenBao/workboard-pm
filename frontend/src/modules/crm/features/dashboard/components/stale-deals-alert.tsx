import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/badge'
import { type GovernanceAlerts } from '../hooks/use-governance-alerts'

interface Props {
  alerts: GovernanceAlerts
}

export function StaleDealsAlert({ alerts }: Props) {
  const total = alerts.stale_deals_count + alerts.stale_leads_count
    + alerts.unassigned_leads + alerts.overdue_tickets
    + (alerts.missing_deal_values ?? 0) + (alerts.high_value_no_activity ?? 0)
  if (total === 0) return null

  return (
    <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-sm font-medium text-foreground">Governance Alerts</p>
        <Badge variant="secondary" className="ml-auto">{total}</Badge>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-sm">
        <AlertStat label="Stale Deals" count={alerts.stale_deals_count} href="/crm/deals" />
        <AlertStat label="Stale Leads" count={alerts.stale_leads_count} href="/crm/leads" />
        <AlertStat label="Unassigned Leads" count={alerts.unassigned_leads} href="/crm/leads" />
        <AlertStat label="Overdue Tickets" count={alerts.overdue_tickets} href="/crm/tickets" />
        <AlertStat label="Deals No Value" count={alerts.missing_deal_values ?? 0} href="/crm/deals" />
        <AlertStat label="High Value Idle" count={alerts.high_value_no_activity ?? 0} href="/crm/pipeline" />
      </div>
      {alerts.stale_deals.length > 0 && (
        <div className="mt-3 space-y-1">
          {alerts.stale_deals.slice(0, 5).map((d) => (
            <Link
              key={d.id}
              to="/crm/deals"
              className="flex items-center justify-between text-xs px-1 hover:bg-amber-500/10 rounded transition-colors"
            >
              <span className="truncate">{d.title}</span>
              <Badge variant="secondary" className="text-xs ml-2">{d.stage}</Badge>
            </Link>
          ))}
          {alerts.stale_deals_count > 5 && (
            <Link to="/crm/deals" className="block text-xs text-muted-foreground hover:text-foreground px-1 pt-1">
              View all {alerts.stale_deals_count} stale deals →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function AlertStat({ label, count, href }: { label: string; count: number; href?: string }) {
  const content = (
    <div className={href && count > 0 ? 'group' : undefined}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${href && count > 0 ? 'group-hover:text-primary transition-colors' : ''}`}>
        {count}
      </p>
    </div>
  )
  if (href && count > 0) {
    return <Link to={href}>{content}</Link>
  }
  return content
}
