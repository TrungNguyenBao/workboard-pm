import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Supplier {
  id: string
  name: string
  contact_email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  workspace_id: string
}

export interface PaginatedSuppliers {
  items: Supplier[]
  total: number
  page: number
  page_size: number
}

interface SupplierFilters {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/wms/workspaces/${wsId}/suppliers`

export function useSuppliers(workspaceId: string, filters: SupplierFilters = {}) {
  const { search, is_active, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedSuppliers>({
    queryKey: ['wms-suppliers', workspaceId, { search, is_active, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, is_active, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateSupplier(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-suppliers', workspaceId] }),
  })
}

export function useUpdateSupplier(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, ...data }: { supplierId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${supplierId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-suppliers', workspaceId] }),
  })
}

export function useDeleteSupplier(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (supplierId: string) => api.delete(`${base(workspaceId)}/${supplierId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-suppliers', workspaceId] }),
  })
}
