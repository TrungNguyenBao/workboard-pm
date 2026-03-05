import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface TrainingProgram {
  id: string
  name: string
  description: string | null
  budget: number | null
  start_date: string | null
  end_date: string | null
  trainer: string | null
  status: string
  workspace_id: string
}

export interface PaginatedTrainingPrograms {
  items: TrainingProgram[]
  total: number
  page: number
  page_size: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/training-programs`

export function useTrainingPrograms(
  workspaceId: string,
  filters: { status?: string; search?: string; page?: number; page_size?: number } = {},
) {
  const { status, search, page = 1, page_size = 50 } = filters
  return useQuery<PaginatedTrainingPrograms>({
    queryKey: ['hrm-training-programs', workspaceId, { status, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateTrainingProgram(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-programs', workspaceId] }),
  })
}

export function useUpdateTrainingProgram(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ programId, ...data }: { programId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${programId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-programs', workspaceId] }),
  })
}

export function useDeleteTrainingProgram(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (programId: string) => api.delete(`${base(workspaceId)}/${programId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-programs', workspaceId] }),
  })
}
