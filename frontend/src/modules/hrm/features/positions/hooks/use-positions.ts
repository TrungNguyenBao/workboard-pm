import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Position {
  id: string
  title: string
  department_id: string
  headcount_limit: number
  description: string | null
  is_active: boolean
  workspace_id: string
  created_at: string | null
  updated_at: string | null
}

export interface PaginatedPositions {
  items: Position[]
  total: number
  page: number
  page_size: number
}

interface PositionFilters {
  department_id?: string
  search?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/positions`

export function usePositions(workspaceId: string, filters: PositionFilters = {}) {
  const { department_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedPositions>({
    queryKey: ['hrm-positions', workspaceId, { department_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { department_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreatePosition(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-positions', workspaceId] }),
  })
}

export function useUpdatePosition(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ positionId, ...data }: { positionId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${positionId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-positions', workspaceId] }),
  })
}

export function useDeletePosition(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (positionId: string) => api.delete(`${base(workspaceId)}/${positionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-positions', workspaceId] }),
  })
}
