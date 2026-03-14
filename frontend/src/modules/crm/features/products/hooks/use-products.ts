import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface ProductService {
  id: string
  name: string
  code: string
  type: 'product' | 'service' | 'bundle'
  category: string | null
  unit_price: number
  currency: string
  description: string | null
  is_active: boolean
  workspace_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedProducts {
  items: ProductService[]
  total: number
  page: number
  page_size: number
}

interface ProductFilters {
  search?: string
  type?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

export const PRODUCT_TYPES = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'bundle', label: 'Bundle' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/products`

export function useProducts(workspaceId: string, filters: ProductFilters = {}) {
  const { search, type, is_active, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedProducts>({
    queryKey: ['crm-products', workspaceId, { search, type, is_active, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, type, is_active, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateProduct(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-products', workspaceId] }),
  })
}

export function useUpdateProduct(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, ...data }: { productId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${productId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-products', workspaceId] }),
  })
}

export function useDeleteProduct(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => api.delete(`${base(workspaceId)}/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-products', workspaceId] }),
  })
}
