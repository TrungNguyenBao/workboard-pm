import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { PurchaseItem } from './use-purchase-items'

export interface PurchaseRequest {
  id: string
  title: string
  description: string | null
  estimated_total: number
  status: string
  requester_id: string
  approved_by_id: string | null
  workspace_id: string
  created_at: string
  updated_at: string
  items: PurchaseItem[]
}

export interface PaginatedPurchaseRequests {
  items: PurchaseRequest[]
  total: number
  page: number
  page_size: number
}

interface PRFilters {
  status?: string
  requester_id?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/purchase-requests`

export function usePurchaseRequests(workspaceId: string, filters: PRFilters = {}) {
  const { status, requester_id, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedPurchaseRequests>({
    queryKey: ['hrm-purchase-requests', workspaceId, { status, requester_id, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, requester_id, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreatePurchaseRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] }),
  })
}

export function useUpdatePurchaseRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ prId, ...data }: { prId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${prId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] }),
  })
}

export function useDeletePurchaseRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prId: string) => api.delete(`${base(workspaceId)}/${prId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] }),
  })
}

export function useSubmitPurchaseRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prId: string) => api.post(`${base(workspaceId)}/${prId}/submit`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] }),
  })
}

export function useApprovePurchaseRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prId: string) => api.post(`${base(workspaceId)}/${prId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] }),
  })
}

export function useRejectPurchaseRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prId: string) => api.post(`${base(workspaceId)}/${prId}/reject`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] }),
  })
}
