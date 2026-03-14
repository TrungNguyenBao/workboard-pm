import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Competitor {
  id: string
  deal_id: string
  name: string
  strengths: string | null
  weaknesses: string | null
  price_comparison: 'higher' | 'similar' | 'lower' | null
  status: 'active' | 'won' | 'lost'
  workspace_id: string
  created_at: string
  updated_at: string
}

const base = (wsId: string, dealId: string) =>
  `/crm/workspaces/${wsId}/deals/${dealId}/competitors`

export function useDealCompetitors(workspaceId: string, dealId: string) {
  return useQuery<Competitor[]>({
    queryKey: ['crm-competitors', workspaceId, dealId],
    queryFn: () => api.get(base(workspaceId, dealId)).then((r) => r.data),
    enabled: !!workspaceId && !!dealId,
  })
}

export function useCreateCompetitor(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId, dealId), data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-competitors', workspaceId, dealId] }),
  })
}

export function useUpdateCompetitor(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ competitorId, ...data }: { competitorId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId, dealId)}/${competitorId}`, data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-competitors', workspaceId, dealId] }),
  })
}

export function useDeleteCompetitor(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (competitorId: string) =>
      api.delete(`${base(workspaceId, dealId)}/${competitorId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-competitors', workspaceId, dealId] }),
  })
}
