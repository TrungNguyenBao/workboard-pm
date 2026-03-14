import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface DealContactRole {
  id: string
  deal_id: string
  contact_id: string
  role: string
  is_primary: boolean
  workspace_id: string
  created_at: string
  updated_at: string
}

export const DEAL_CONTACT_ROLES = [
  { value: 'decision_maker', label: 'Decision Maker' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'champion', label: 'Champion' },
  { value: 'end_user', label: 'End User' },
  { value: 'blocker', label: 'Blocker' },
  { value: 'other', label: 'Other' },
] as const

const base = (wsId: string, dealId: string) =>
  `/crm/workspaces/${wsId}/deals/${dealId}/contacts`

export function useDealContacts(workspaceId: string, dealId: string) {
  return useQuery<DealContactRole[]>({
    queryKey: ['crm-deal-contacts', workspaceId, dealId],
    queryFn: () => api.get(base(workspaceId, dealId)).then((r) => r.data),
    enabled: !!workspaceId && !!dealId,
  })
}

export function useAddDealContact(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { contact_id: string; role: string; is_primary?: boolean }) =>
      api.post(base(workspaceId, dealId), data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-deal-contacts', workspaceId, dealId] }),
  })
}

export function useUpdateDealContact(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      roleId,
      ...data
    }: { roleId: string } & Partial<{ role: string; is_primary: boolean }>) =>
      api.patch(`${base(workspaceId, dealId)}/${roleId}`, data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-deal-contacts', workspaceId, dealId] }),
  })
}

export function useRemoveDealContact(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) =>
      api.delete(`${base(workspaceId, dealId)}/${roleId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-deal-contacts', workspaceId, dealId] }),
  })
}
