import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Candidate, PaginatedCandidates } from './use-candidates'

interface MoveCandidateVars {
  candidateId: string
  status: string
}

/**
 * Optimistic-update mutation: moves a candidate to a new pipeline stage.
 * Calls PATCH /hrm/workspaces/{workspaceId}/candidates/{candidateId}
 */
export function useMoveCandidate(workspaceId: string) {
  const qc = useQueryClient()
  const queryKey = ['hrm-candidates', workspaceId]

  return useMutation({
    mutationFn: ({ candidateId, status }: MoveCandidateVars) =>
      api
        .patch(`/hrm/workspaces/${workspaceId}/candidates/${candidateId}`, { status })
        .then((r) => r.data as Candidate),

    onMutate: async ({ candidateId, status }) => {
      await qc.cancelQueries({ queryKey })
      const snapshots = qc.getQueriesData<PaginatedCandidates>({ queryKey })

      qc.setQueriesData<PaginatedCandidates>({ queryKey }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((c) =>
            c.id === candidateId ? { ...c, status } : c
          ),
        }
      })

      return { snapshots }
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data))
    },

    onSettled: () => qc.invalidateQueries({ queryKey }),
  })
}
