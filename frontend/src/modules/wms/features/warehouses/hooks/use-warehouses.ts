import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Warehouse {
  id: string
  name: string
  location: string | null
  address: string | null
  manager_name: string | null
  description: string | null
  workspace_id: string
  is_active: boolean
}

export interface PaginatedWarehouses {
  items: Warehouse[]
  total: number
  page: number
  page_size: number
}

interface WarehouseFilters {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/wms/workspaces/${wsId}/warehouses`

export function useWarehouses(workspaceId: string, filters: WarehouseFilters = {}) {
  const { search, is_active, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedWarehouses>({
    queryKey: ['wms-warehouses', workspaceId, { search, is_active, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, is_active, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateWarehouse(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-warehouses', workspaceId] }),
  })
}

export function useUpdateWarehouse(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ warehouseId, ...data }: { warehouseId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${warehouseId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-warehouses', workspaceId] }),
  })
}

export function useDeleteWarehouse(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (warehouseId: string) => api.delete(`${base(workspaceId)}/${warehouseId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-warehouses', workspaceId] }),
  })
}
