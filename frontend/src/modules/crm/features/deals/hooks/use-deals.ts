import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Deal {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  expected_close_date: string | null
  contact_id: string | null
  account_id: string | null
  lead_id: string | null
  last_activity_date: string | null
  loss_reason: string | null
  closed_at: string | null
  owner_id: string | null
  last_updated_by: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedDeals {
  items: Deal[]
  total: number
  page: number
  page_size: number
}

interface DealFilters {
  stage?: string
  contact_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const DEAL_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'needs_analysis', label: 'Needs Analysis' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/deals`

export function useDeals(workspaceId: string, filters: DealFilters = {}) {
  const { stage, contact_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedDeals>({
    queryKey: ['crm-deals', workspaceId, { stage, contact_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { stage, contact_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] }),
  })
}

export function useUpdateDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, ...data }: { dealId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${dealId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] }),
  })
}

export function useDeleteDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dealId: string) => api.delete(`${base(workspaceId)}/${dealId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] }),
  })
}

export function useCloseDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, action, loss_reason }: {
      dealId: string; action: 'won' | 'lost'; loss_reason?: string
    }) =>
      api.post(`${base(workspaceId)}/${dealId}/close`, null, {
        params: { action, loss_reason },
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] })
      qc.invalidateQueries({ queryKey: ['crm-analytics', workspaceId] })
    },
  })
}

export function useStaleDeals(workspaceId: string, days = 30) {
  return useQuery({
    queryKey: ['crm-deals-stale', workspaceId, days],
    queryFn: () =>
      api.get(`${base(workspaceId)}/stale`, { params: { days } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
