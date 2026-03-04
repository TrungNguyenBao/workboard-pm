import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface KpiTemplate {
  id: string
  name: string
  description: string | null
  category: string | null
  measurement_unit: string | null
  workspace_id: string
}

export interface PaginatedKpiTemplates {
  items: KpiTemplate[]
  total: number
  page: number
  page_size: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/kpi-templates`

export function useKpiTemplates(workspaceId: string, filters: { search?: string; page?: number; page_size?: number } = {}) {
  const { search, page = 1, page_size = 50 } = filters
  return useQuery<PaginatedKpiTemplates>({
    queryKey: ['hrm-kpi-templates', workspaceId, { search, page, page_size }],
    queryFn: () => api.get(base(workspaceId), { params: { search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateKpiTemplate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-templates', workspaceId] }),
  })
}

export function useUpdateKpiTemplate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, ...data }: { templateId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${templateId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-templates', workspaceId] }),
  })
}

export function useDeleteKpiTemplate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) => api.delete(`${base(workspaceId)}/${templateId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-kpi-templates', workspaceId] }),
  })
}
