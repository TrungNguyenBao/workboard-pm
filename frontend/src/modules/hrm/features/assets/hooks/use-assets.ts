import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Asset {
  id: string
  name: string
  category: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_value: number | null
  current_value: number | null
  status: string
  location: string | null
  notes: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedAssets {
  items: Asset[]
  total: number
  page: number
  page_size: number
}

interface AssetFilters {
  status?: string
  category?: string
  search?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/assets`

export function useAssets(workspaceId: string, filters: AssetFilters = {}) {
  const { status, category, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedAssets>({
    queryKey: ['hrm-assets', workspaceId, { status, category, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, category, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateAsset(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-assets', workspaceId] }),
  })
}

export function useUpdateAsset(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assetId, ...data }: { assetId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${assetId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-assets', workspaceId] }),
  })
}

export function useDeleteAsset(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assetId: string) => api.delete(`${base(workspaceId)}/${assetId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-assets', workspaceId] }),
  })
}
