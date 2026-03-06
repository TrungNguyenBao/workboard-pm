import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Activity {
  id: string
  type: string
  subject: string
  notes: string | null
  date: string
  owner_id: string | null
  contact_id: string | null
  deal_id: string | null
  lead_id: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedActivities {
  items: Activity[]
  total: number
  page: number
  page_size: number
}

interface ActivityFilters {
  type?: string
  contact_id?: string
  deal_id?: string
  lead_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'demo', label: 'Demo' },
  { value: 'follow_up', label: 'Follow Up' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/activities`

export function useActivities(workspaceId: string, filters: ActivityFilters = {}) {
  const { type, contact_id, deal_id, lead_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedActivities>({
    queryKey: ['crm-activities', workspaceId, { type, contact_id, deal_id, lead_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { type, contact_id, deal_id, lead_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateActivity(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-activities', workspaceId] }),
  })
}

export function useUpdateActivity(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ activityId, ...data }: { activityId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${activityId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-activities', workspaceId] }),
  })
}

export function useDeleteActivity(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (activityId: string) => api.delete(`${base(workspaceId)}/${activityId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-activities', workspaceId] }),
  })
}
