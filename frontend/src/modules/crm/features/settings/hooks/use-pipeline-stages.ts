import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface PipelineStage {
  id: string
  name: string
  position: number
  default_probability: number
  workspace_id: string
  created_at: string
  updated_at: string
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/pipeline-stages`
const QK = (wsId: string) => ['crm-pipeline-stages', wsId]

export function usePipelineStages(workspaceId: string) {
  return useQuery<PipelineStage[]>({
    queryKey: QK(workspaceId),
    queryFn: () => api.get(base(workspaceId)).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateStage(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; position?: number; default_probability?: number }) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(workspaceId) }),
  })
}

export function useUpdateStage(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ stageId, ...data }: { stageId: string; name?: string; position?: number; default_probability?: number }) =>
      api.patch(`${base(workspaceId)}/${stageId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(workspaceId) }),
  })
}

export function useDeleteStage(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stageId: string) => api.delete(`${base(workspaceId)}/${stageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(workspaceId) }),
  })
}

export function useReorderStages(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stageIds: string[]) =>
      api.put(`${base(workspaceId)}/reorder`, { stage_ids: stageIds }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(workspaceId) }),
  })
}

export function useSeedDefaultStages(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`${base(workspaceId)}/seed`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(workspaceId) }),
  })
}
