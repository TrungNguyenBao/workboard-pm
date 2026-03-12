import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface ScoringRuleItem {
  activity_type: string
  points: number
}

export interface ScoringThresholds {
  cold_max: number
  warm_max: number
}

export interface ScoringConfig {
  id: string
  workspace_id: string
  rules: {
    activity_scores: Record<string, number>
    thresholds: ScoringThresholds
  }
  created_at: string
  updated_at: string
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/scoring-config`
const QK = (wsId: string) => ['crm-scoring-config', wsId]

export function useScoringConfig(workspaceId: string) {
  return useQuery<ScoringConfig>({
    queryKey: QK(workspaceId),
    queryFn: () => api.get(base(workspaceId)).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useUpdateScoringConfig(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { rules: ScoringRuleItem[]; thresholds: ScoringThresholds }) =>
      api.put(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(workspaceId) }),
  })
}
