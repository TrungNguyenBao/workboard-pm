import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface PurchaseItem {
  id: string
  request_id: string
  item_name: string
  quantity: number
  unit_price: number
  total: number
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedPurchaseItems {
  items: PurchaseItem[]
  total: number
  page: number
  page_size: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/purchase-items`

export function usePurchaseItems(workspaceId: string, requestId?: string) {
  return useQuery<PaginatedPurchaseItems>({
    queryKey: ['hrm-purchase-items', workspaceId, requestId],
    queryFn: () =>
      api.get(base(workspaceId), { params: { request_id: requestId, page_size: 100 } }).then((r) => r.data),
    enabled: !!workspaceId && !!requestId,
  })
}

export function useCreatePurchaseItem(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-purchase-items', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] })
    },
  })
}

export function useUpdatePurchaseItem(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, ...data }: { itemId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${itemId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-purchase-items', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] })
    },
  })
}

export function useDeletePurchaseItem(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`${base(workspaceId)}/${itemId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-purchase-items', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-purchase-requests', workspaceId] })
    },
  })
}
