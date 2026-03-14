import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, Mail, AlertCircle, Calendar, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  type CrmNotification,
  useCrmNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from '../hooks/use-crm-notifications'

const TYPE_ICON: Record<string, React.ReactNode> = {
  deal_update: <DollarSign className="h-3.5 w-3.5" />,
  task_due: <Calendar className="h-3.5 w-3.5" />,
  mention: <Mail className="h-3.5 w-3.5" />,
}

const ENTITY_PATH: Record<string, (id: string) => string> = {
  deal: (id) => `/crm/deals?id=${id}`,
  contact: (id) => `/crm/contacts?id=${id}`,
  account: (id) => `/crm/accounts/${id}`,
  contract: (id) => `/crm/contracts?id=${id}`,
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationItem({
  n,
  onRead,
}: {
  n: CrmNotification
  onRead: (id: string, entityType: string | null, entityId: string | null) => void
}) {
  const icon = TYPE_ICON[n.type] ?? <AlertCircle className="h-3.5 w-3.5" />
  return (
    <button
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 flex gap-3 items-start border-b border-border last:border-0 transition-colors ${!n.is_read ? 'bg-muted/30' : ''}`}
      onClick={() => onRead(n.id, n.entity_type, n.entity_id)}
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!n.is_read ? 'font-medium' : ''}`}>{n.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
      </div>
      {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
    </button>
  )
}

export function NotificationDropdown() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: unreadData } = useUnreadCount(workspaceId)
  const { data } = useCrmNotifications(workspaceId, { page_size: 15 })
  const markRead = useMarkRead(workspaceId)
  const markAllRead = useMarkAllRead(workspaceId)

  const unreadCount = unreadData?.count ?? 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleRead(id: string, entityType: string | null, entityId: string | null) {
    await markRead.mutateAsync(id)
    if (entityType && entityId) {
      const pathFn = ENTITY_PATH[entityType]
      if (pathFn) navigate(pathFn(entityId))
    }
    setOpen(false)
  }

  async function handleMarkAll() {
    await markAllRead.mutateAsync()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-medium">CRM Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={handleMarkAll}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(data?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
            ) : (
              (data?.items ?? []).map((n) => (
                <NotificationItem key={n.id} n={n} onRead={handleRead} />
              ))
            )}
          </div>
          {unreadCount > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <Badge variant="secondary" className="text-xs">{unreadCount} unread</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
