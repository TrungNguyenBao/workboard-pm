import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface TrainingEnrollment {
  id: string
  program_id: string
  employee_id: string
  status: string
  completion_date: string | null
  score: number | null
  feedback: string | null
  workspace_id: string
}

export interface PaginatedEnrollments {
  items: TrainingEnrollment[]
  total: number
  page: number
  page_size: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/training-enrollments`

export function useTrainingEnrollments(
  workspaceId: string,
  filters: { program_id?: string; employee_id?: string; status?: string; page?: number; page_size?: number } = {},
) {
  const { program_id, employee_id, status, page = 1, page_size = 50 } = filters
  return useQuery<PaginatedEnrollments>({
    queryKey: ['hrm-training-enrollments', workspaceId, { program_id, employee_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { program_id, employee_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateTrainingEnrollment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { program_id: string; employee_id: string }) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-enrollments', workspaceId] }),
  })
}

export function useUpdateTrainingEnrollment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, ...data }: { enrollmentId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${enrollmentId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-enrollments', workspaceId] }),
  })
}

export function useCompleteEnrollment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      enrollmentId,
      score,
      feedback,
    }: {
      enrollmentId: string
      score?: number | null
      feedback?: string | null
    }) =>
      api
        .post(`${base(workspaceId)}/${enrollmentId}/complete`, { score, feedback })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-enrollments', workspaceId] }),
  })
}

export function useDeleteTrainingEnrollment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) => api.delete(`${base(workspaceId)}/${enrollmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-training-enrollments', workspaceId] }),
  })
}
