import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  warehouse_id: string
  product_id: string | null
  min_threshold: number
  workspace_id: string
  product_name: string | null
}

export interface PaginatedInventoryItems {
  items: InventoryItem[]
  total: number
  page: number
  page_size: number
}

interface InventoryFilters {
  warehouse_id?: string
  product_id?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/wms/workspaces/${wsId}/inventory-items`

export function useInventoryItems(workspaceId: string, filters: InventoryFilters = {}) {
  const { warehouse_id, product_id, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedInventoryItems>({
    queryKey: ['wms-inventory', workspaceId, { warehouse_id, product_id, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { warehouse_id, product_id, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateInventoryItem(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-inventory', workspaceId] }),
  })
}

export function useUpdateInventoryItem(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, ...data }: { itemId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${itemId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-inventory', workspaceId] }),
  })
}

export function useDeleteInventoryItem(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`${base(workspaceId)}/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-inventory', workspaceId] }),
  })
}
