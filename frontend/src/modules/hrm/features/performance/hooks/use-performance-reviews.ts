import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface PerformanceReview {
  id: string
  employee_id: string
  reviewer_id: string
  period: string
  overall_score: number | null
  status: string
  comments: string | null
  workspace_id: string
}

export interface PaginatedPerformanceReviews {
  items: PerformanceReview[]
  total: number
  page: number
  page_size: number
}

interface ReviewFilters {
  employee_id?: string
  status?: string
  period?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/performance-reviews`

export function usePerformanceReviews(workspaceId: string, filters: ReviewFilters = {}) {
  const { employee_id, status, period, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedPerformanceReviews>({
    queryKey: ['hrm-performance-reviews', workspaceId, { employee_id, status, period, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id, status, period, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreatePerformanceReview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-performance-reviews', workspaceId] }),
  })
}

export function useUpdatePerformanceReview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, ...data }: { reviewId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${reviewId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-performance-reviews', workspaceId] }),
  })
}

export function useSubmitReview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) =>
      api.post(`${base(workspaceId)}/${reviewId}/submit`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-performance-reviews', workspaceId] }),
  })
}

export function useCompleteReview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) =>
      api.post(`${base(workspaceId)}/${reviewId}/complete`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-performance-reviews', workspaceId] }),
  })
}

export function useDeletePerformanceReview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => api.delete(`${base(workspaceId)}/${reviewId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-performance-reviews', workspaceId] }),
  })
}
