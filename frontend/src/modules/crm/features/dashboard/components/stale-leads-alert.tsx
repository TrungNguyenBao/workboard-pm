import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/badge'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useStaleLeads } from '../../leads/hooks/use-leads'

interface StaleLeadItem {
  id: string
  name: string
  status: string
  created_at: string
  contacted_at: string | null
}

interface StaleLeadsResponse {
  count: number
  leads: StaleLeadItem[]
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function StaleLeadsAlert() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data } = useStaleLeads(wsId, 30) as { data: StaleLeadsResponse | undefined }

  if (!data || data.count === 0) return null

  return (
    <div className="border border-orange-500/30 rounded-lg p-4 bg-orange-500/5">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <p className="text-sm font-medium text-foreground">Stale Leads</p>
        <Badge variant="secondary" className="ml-auto">{data.count}</Badge>
      </div>
      <div className="space-y-1">
        {data.leads.slice(0, 5).map((lead) => {
          const refDate = lead.contacted_at ?? lead.created_at
          const days = daysSince(refDate)
          return (
            <Link
              key={lead.id}
              to="/crm/leads"
              className="flex items-center justify-between text-xs px-1 hover:bg-orange-500/10 rounded transition-colors"
            >
              <span className="truncate">{lead.name}</span>
              <span className="text-muted-foreground ml-2 shrink-0">{days}d ago</span>
            </Link>
          )
        })}
        {data.count > 5 && (
          <Link to="/crm/leads" className="block text-xs text-muted-foreground hover:text-foreground px-1 pt-1">
            View all {data.count} stale leads →
          </Link>
        )}
      </div>
    </div>
  )
}
