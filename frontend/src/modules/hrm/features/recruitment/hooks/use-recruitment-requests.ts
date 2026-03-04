import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface RecruitmentRequest {
  id: string
  title: string
  department_id: string
  position_id: string | null
  quantity: number
  reason: string
  requirements: string | null
  deadline: string | null
  status: string
  requester_id: string
  workspace_id: string
}

export interface PaginatedRecruitmentRequests {
  items: RecruitmentRequest[]
  total: number
  page: number
  page_size: number
}

interface RecruitmentRequestFilters {
  department_id?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/recruitment-requests`

export function useRecruitmentRequests(workspaceId: string, filters: RecruitmentRequestFilters = {}) {
  const { department_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedRecruitmentRequests>({
    queryKey: ['hrm-recruitment-requests', workspaceId, { department_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { department_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useRecruitmentRequest(workspaceId: string, requestId: string) {
  return useQuery<RecruitmentRequest>({
    queryKey: ['hrm-recruitment-request', workspaceId, requestId],
    queryFn: () => api.get(`${base(workspaceId)}/${requestId}`).then((r) => r.data),
    enabled: !!workspaceId && !!requestId,
  })
}

export function useCreateRecruitmentRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-recruitment-requests', workspaceId] }),
  })
}

export function useUpdateRecruitmentRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, ...data }: { requestId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${requestId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-recruitment-requests', workspaceId] }),
  })
}

export function useDeleteRecruitmentRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => api.delete(`${base(workspaceId)}/${requestId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-recruitment-requests', workspaceId] }),
  })
}
