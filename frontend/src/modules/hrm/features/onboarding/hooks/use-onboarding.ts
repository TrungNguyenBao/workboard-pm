import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface OnboardingChecklist {
  id: string
  employee_id: string
  task_name: string
  category: string | null
  assigned_to_id: string | null
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  workspace_id: string
}

export interface PaginatedOnboardingChecklists {
  items: OnboardingChecklist[]
  total: number
  page: number
  page_size: number
}

interface OnboardingFilters {
  employee_id?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/onboarding-checklists`

export function useOnboardingChecklists(workspaceId: string, filters: OnboardingFilters = {}) {
  const { employee_id, page = 1, page_size = 50 } = filters
  return useQuery<PaginatedOnboardingChecklists>({
    queryKey: ['hrm-onboarding', workspaceId, { employee_id, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateOnboardingChecklist(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-onboarding', workspaceId] }),
  })
}

export function useToggleOnboardingCompletion(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) =>
      api.patch(`${base(workspaceId)}/${itemId}/complete`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-onboarding', workspaceId] }),
  })
}

export function useGenerateDefaultChecklist(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (employeeId: string) =>
      api.post(`${base(workspaceId)}/generate/${employeeId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-onboarding', workspaceId] }),
  })
}

export function useDeleteOnboardingChecklist(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`${base(workspaceId)}/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-onboarding', workspaceId] }),
  })
}
