import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface ReviewFeedback {
  id: string
  review_id: string
  from_employee_id: string
  relationship_type: string
  scores: Record<string, number> | null
  comments: string | null
  submitted_at: string | null
  workspace_id: string
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/review-feedback`

export function useReviewFeedback(workspaceId: string, reviewId?: string) {
  return useQuery<ReviewFeedback[]>({
    queryKey: ['hrm-review-feedback', workspaceId, reviewId],
    queryFn: () =>
      api.get(base(workspaceId), { params: { review_id: reviewId } }).then((r) => r.data),
    enabled: !!workspaceId && !!reviewId,
  })
}

export function useCreateReviewFeedback(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['hrm-review-feedback', workspaceId, variables.review_id as string] })
    },
  })
}
