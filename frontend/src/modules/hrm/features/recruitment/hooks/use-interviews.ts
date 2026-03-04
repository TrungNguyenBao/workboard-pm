import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Interview {
  id: string
  candidate_id: string
  interviewer_id: string | null
  scheduled_at: string
  duration_minutes: number
  feedback: string | null
  score: number | null
  status: string
  workspace_id: string
}

export interface PaginatedInterviews {
  items: Interview[]
  total: number
  page: number
  page_size: number
}

interface InterviewFilters {
  candidate_id?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/interviews`

export function useInterviews(workspaceId: string, filters: InterviewFilters = {}) {
  const { candidate_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedInterviews>({
    queryKey: ['hrm-interviews', workspaceId, { candidate_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { candidate_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateInterview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-interviews', workspaceId] }),
  })
}

export function useUpdateInterview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ interviewId, ...data }: { interviewId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${interviewId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-interviews', workspaceId] }),
  })
}

export function useCompleteInterview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ interviewId, feedback, score }: { interviewId: string; feedback?: string; score?: number }) =>
      api.post(`${base(workspaceId)}/${interviewId}/complete`, { feedback, score }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-interviews', workspaceId] }),
  })
}

export function useDeleteInterview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (interviewId: string) => api.delete(`${base(workspaceId)}/${interviewId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-interviews', workspaceId] }),
  })
}
