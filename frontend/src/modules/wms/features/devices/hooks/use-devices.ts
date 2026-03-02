import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Device {
  id: string
  serial_number: string
  product_id: string
  warehouse_id: string | null
  status: string
  notes: string | null
  workspace_id: string
  product_name: string | null
  warehouse_name: string | null
}

export interface PaginatedDevices {
  items: Device[]
  total: number
  page: number
  page_size: number
}

interface DeviceFilters {
  search?: string
  product_id?: string
  warehouse_id?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/wms/workspaces/${wsId}/devices`

export function useDevices(workspaceId: string, filters: DeviceFilters = {}) {
  const { search, product_id, warehouse_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedDevices>({
    queryKey: ['wms-devices', workspaceId, { search, product_id, warehouse_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, product_id, warehouse_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateDevice(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-devices', workspaceId] }),
  })
}

export function useUpdateDevice(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ deviceId, ...data }: { deviceId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${deviceId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-devices', workspaceId] }),
  })
}

export function useDeleteDevice(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (deviceId: string) => api.delete(`${base(workspaceId)}/${deviceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms-devices', workspaceId] }),
  })
}
