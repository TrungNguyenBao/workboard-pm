import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { toast } from '@/shared/components/ui/toast'

export type MemberRole = 'owner' | 'editor' | 'commenter' | 'viewer'

export interface MemberResponse {
  id: string
  project_id: string
  user_id: string
  user_name: string
  user_email: string
  role: MemberRole
}

export function useProjectMembers(projectId: string) {
  return useQuery<MemberResponse[]>({
    queryKey: ['project-members', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}/members`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { user_id: string; role: MemberRole }) =>
      api.post(`/pms/projects/${projectId}/members`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] })
      toast({ title: 'Member added', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to add member', variant: 'error' }),
  })
}

export function useUpdateMemberRole(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      api.patch(`/pms/projects/${projectId}/members/${userId}`, { role }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] })
      toast({ title: 'Role updated', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to update role', variant: 'error' }),
  })
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/pms/projects/${projectId}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] })
      toast({ title: 'Member removed', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to remove member', variant: 'error' }),
  })
}
