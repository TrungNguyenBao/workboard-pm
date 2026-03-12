import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Tag {
  id: string
  name: string
  color: string
}

export function useTags(workspaceId: string | null) {
  return useQuery<Tag[]>({
    queryKey: ['tags', workspaceId],
    queryFn: () =>
      api.get(`/pms/workspaces/${workspaceId}/tags`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateTag(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post(`/pms/workspaces/${workspaceId}/tags`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags', workspaceId] }),
  })
}

export function useUpdateTag(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tagId, ...data }: { tagId: string; name?: string; color?: string }) =>
      api.patch(`/pms/workspaces/${workspaceId}/tags/${tagId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags', workspaceId] }),
  })
}

export function useDeleteTag(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tagId: string) =>
      api.delete(`/pms/workspaces/${workspaceId}/tags/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags', workspaceId] }),
  })
}
