import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Offer {
  id: string
  candidate_id: string
  position_title: string
  offered_salary: string
  start_date: string
  expiry_date: string | null
  status: string
  notes: string | null
  workspace_id: string
}

export interface PaginatedOffers {
  items: Offer[]
  total: number
  page: number
  page_size: number
}

interface OfferFilters {
  candidate_id?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/offers`

export function useOffers(workspaceId: string, filters: OfferFilters = {}) {
  const { candidate_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedOffers>({
    queryKey: ['hrm-offers', workspaceId, { candidate_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { candidate_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateOffer(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-offers', workspaceId] }),
  })
}

export function useUpdateOffer(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ offerId, ...data }: { offerId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${offerId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-offers', workspaceId] }),
  })
}

export function useSendOffer(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => api.post(`${base(workspaceId)}/${offerId}/send`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-offers', workspaceId] }),
  })
}

export function useAcceptOffer(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => api.post(`${base(workspaceId)}/${offerId}/accept`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-offers', workspaceId] }),
  })
}

export function useRejectOffer(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => api.post(`${base(workspaceId)}/${offerId}/reject`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-offers', workspaceId] }),
  })
}

export function useDeleteOffer(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => api.delete(`${base(workspaceId)}/${offerId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-offers', workspaceId] }),
  })
}
