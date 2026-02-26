import { Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  resource_type: string | null
  resource_id: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter((n) => !n.is_read)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unread.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-neutral-400">No notifications</div>
        )}
        {notifications.slice(0, 8).map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-0.5 py-2.5 cursor-pointer"
            onClick={() => {
              if (!n.is_read) markRead.mutate(n.id)
              if (n.resource_type === 'task') {
                navigate('/my-tasks')
              }
            }}
          >
            <div className="flex items-start gap-2 w-full">
              {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
              <span className={`text-sm leading-tight flex-1 ${n.is_read ? 'text-neutral-500' : 'text-neutral-900 font-medium'}`}>
                {n.title}
              </span>
            </div>
            <span className="text-xs text-neutral-400 pl-3.5">{formatRelativeTime(n.created_at)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
