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
  /** Activity governance warning returned by backend when deal is stale or needs attention */
  warning?: string
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

/** Default probability per stage */
export const STAGE_PROBABILITY: Record<string, number> = {
  lead: 5,
  qualified: 10,
  needs_analysis: 20,
  proposal: 50,
  negotiation: 75,
  closed_won: 100,
  closed_lost: 0,
}

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

export function useUpdateDealStage(workspaceId: string) {
  const qc = useQueryClient()
  const queryKey = ['crm-deals', workspaceId]
  return useMutation({
    mutationFn: ({ dealId, stage, probability }: { dealId: string; stage: string; probability: number }) =>
      api.patch(`${base(workspaceId)}/${dealId}`, { stage, probability }).then((r) => r.data),
    onMutate: async ({ dealId, stage, probability }) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueriesData<PaginatedDeals>({ queryKey })
      qc.setQueriesData<PaginatedDeals>({ queryKey }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((d) => d.id === dealId ? { ...d, stage, probability } : d),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) qc.setQueryData(key, data)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
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
      api.post(`${base(workspaceId)}/${dealId}/close`, { action, loss_reason }).then((r) => r.data),
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
