import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/badge'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAccountFollowUps } from '../../accounts/hooks/use-accounts'

interface FollowUpAccount {
  id: string
  name: string
  next_follow_up_date: string
}

interface FollowUpsResponse {
  count: number
  accounts: FollowUpAccount[]
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toDateString())
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function FollowUpsDueWidget() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data } = useAccountFollowUps(wsId) as { data: FollowUpsResponse | undefined }

  if (!data || data.count === 0) return null

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Follow-ups Due</p>
        <Badge variant="secondary" className="ml-auto">{data.count}</Badge>
      </div>
      <div className="space-y-1">
        {data.accounts.slice(0, 6).map((account) => {
          const overdue = isOverdue(account.next_follow_up_date)
          return (
            <Link
              key={account.id}
              to={`/crm/accounts/${account.id}`}
              className="flex items-center justify-between text-xs px-1 py-0.5 hover:bg-muted/50 rounded transition-colors"
            >
              <span className="truncate">{account.name}</span>
              <span className={overdue ? 'text-red-500 font-medium ml-2 shrink-0' : 'text-muted-foreground ml-2 shrink-0'}>
                {overdue ? 'Overdue' : formatDate(account.next_follow_up_date)}
              </span>
            </Link>
          )
        })}
        {data.count > 6 && (
          <Link to="/crm/accounts" className="block text-xs text-muted-foreground hover:text-foreground px-1 pt-1">
            View all {data.count} follow-ups →
          </Link>
        )}
      </div>
    </div>
  )
}
