import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  description: string | null
  unit: string
  is_serial_tracked: boolean
  is_active: boolean
  workspace_id: string
}

export interface PaginatedProducts {
  items: Product[]
  total: number
  page: number
  page_size: number
}

interface ProductFilters {
  search?: string
  category?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/wms/workspaces/${wsId}/products`

export function useProducts(workspaceId: string, filters: ProductFilters = {}) {
  const { search, category, is_active, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedProducts>({
    queryKey: ['wms-products', workspaceId, { search, category, is_active, page, page_size }],
    queryFn: () =>
      api
        .get(base(workspaceId), { params: { search, category, is_active, page, page_size } })
        .then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateProduct(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-products', workspaceId] }),
  })
}

export function useUpdateProduct(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, ...data }: { productId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${productId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-products', workspaceId] }),
  })
}

export function useDeleteProduct(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => api.delete(`${base(workspaceId)}/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-products', workspaceId] }),
  })
}
