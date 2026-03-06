import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Campaign {
  id: string
  name: string
  type: string
  budget: number
  actual_cost: number
  start_date: string | null
  end_date: string | null
  status: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedCampaigns {
  items: Campaign[]
  total: number
  page: number
  page_size: number
}

interface CampaignFilters {
  status?: string
  type?: string
  search?: string
  page?: number
  page_size?: number
}

export const CAMPAIGN_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'ads', label: 'Ads' },
  { value: 'event', label: 'Event' },
  { value: 'social', label: 'Social' },
] as const

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/campaigns`

export function useCampaigns(workspaceId: string, filters: CampaignFilters = {}) {
  const { status, type, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedCampaigns>({
    queryKey: ['crm-campaigns', workspaceId, { status, type, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, type, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateCampaign(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-campaigns', workspaceId] }),
  })
}

export function useUpdateCampaign(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, ...data }: { campaignId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${campaignId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-campaigns', workspaceId] }),
  })
}

export function useDeleteCampaign(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => api.delete(`${base(workspaceId)}/${campaignId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-campaigns', workspaceId] }),
  })
}
