import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface KpiAssignment {
  id: string
  template_id: string
  employee_id: string
  period: string
  target_value: number
  actual_value: number | null
  weight: number
  status: string
  notes: string | null
  workspace_id: string
}

export interface PaginatedKpiAssignments {
  items: KpiAssignment[]
  total: number
  page: number
  page_size: number
}

interface KpiAssignmentFilters {
  employee_id?: string
  period?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/kpi-assignments`

export function useKpiAssignments(workspaceId: string, filters: KpiAssignmentFilters = {}) {
  const { employee_id, period, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedKpiAssignments>({
    queryKey: ['hrm-kpi-assignments', workspaceId, { employee_id, period, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id, period, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateKpiAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-assignments', workspaceId] }),
  })
}

export function useUpdateKpiAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, ...data }: { assignmentId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${assignmentId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-assignments', workspaceId] }),
  })
}

export function useCompleteKpiAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, actual_value }: { assignmentId: string; actual_value: number }) =>
      api.post(`${base(workspaceId)}/${assignmentId}/complete`, { actual_value }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-assignments', workspaceId] }),
  })
}

export function useDeleteKpiAssignment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) => api.delete(`${base(workspaceId)}/${assignmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-assignments', workspaceId] }),
  })
}
