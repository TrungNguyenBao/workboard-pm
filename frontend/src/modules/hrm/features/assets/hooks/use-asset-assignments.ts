import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface AssetAssignment {
  id: string
  asset_id: string
  employee_id: string
  assigned_date: string
  returned_date: string | null
  condition_on_assign: string
  condition_on_return: string | null
  notes: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedAssignments {
  items: AssetAssignment[]
  total: number
  page: number
  page_size: number
}

interface AssignmentFilters {
  asset_id?: string
  employee_id?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/asset-assignments`

export function useAssetAssignments(workspaceId: string, filters: AssignmentFilters = {}) {
  const { asset_id, employee_id, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedAssignments>({
    queryKey: ['hrm-asset-assignments', workspaceId, { asset_id, employee_id, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { asset_id, employee_id, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateAssetAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-asset-assignments', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-assets', workspaceId] })
    },
  })
}

export function useUpdateAssetAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, ...data }: { assignmentId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${assignmentId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-asset-assignments', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-assets', workspaceId] })
    },
  })
}

export function useDeleteAssetAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) => api.delete(`${base(workspaceId)}/${assignmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-asset-assignments', workspaceId] }),
  })
}
