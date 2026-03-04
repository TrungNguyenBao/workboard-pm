import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Candidate {
  id: string
  recruitment_request_id: string
  name: string
  email: string
  phone: string | null
  resume_url: string | null
  status: string
  notes: string | null
  workspace_id: string
}

export interface PaginatedCandidates {
  items: Candidate[]
  total: number
  page: number
  page_size: number
}

interface CandidateFilters {
  recruitment_request_id?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/candidates`

export function useCandidates(workspaceId: string, filters: CandidateFilters = {}) {
  const { recruitment_request_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedCandidates>({
    queryKey: ['hrm-candidates', workspaceId, { recruitment_request_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { recruitment_request_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-candidates', workspaceId] }),
  })
}

export function useUpdateCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ candidateId, ...data }: { candidateId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${candidateId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-candidates', workspaceId] }),
  })
}

export function useUpdateCandidateStatus(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ candidateId, new_status }: { candidateId: string; new_status: string }) =>
      api.post(`${base(workspaceId)}/${candidateId}/update-status`, { new_status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-candidates', workspaceId] }),
  })
}

export function useDeleteCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (candidateId: string) => api.delete(`${base(workspaceId)}/${candidateId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-candidates', workspaceId] }),
  })
}
