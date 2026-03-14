import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface CrmNotification {
  id: string
  recipient_id: string
  type: string
  title: string
  body: string
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  channel: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedCrmNotifications {
  items: CrmNotification[]
  total: number
  page: number
  page_size: number
}

interface NotificationFilters {
  is_read?: boolean
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/notifications`

export function useCrmNotifications(workspaceId: string, filters: NotificationFilters = {}) {
  const { is_read, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedCrmNotifications>({
    queryKey: ['crm-notifications', workspaceId, { is_read, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { is_read, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useUnreadCount(workspaceId: string) {
  return useQuery<{ count: number }>({
    queryKey: ['crm-notifications-unread', workspaceId],
    queryFn: () =>
      api.get(`${base(workspaceId)}/unread-count`).then((r) => r.data),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  })
}

export function useMarkRead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post(`${base(workspaceId)}/${notificationId}/read`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-notifications', workspaceId] })
      qc.invalidateQueries({ queryKey: ['crm-notifications-unread', workspaceId] })
    },
  })
}

export function useMarkAllRead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post(`${base(workspaceId)}/read-all`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-notifications', workspaceId] })
      qc.invalidateQueries({ queryKey: ['crm-notifications-unread', workspaceId] })
    },
  })
}
