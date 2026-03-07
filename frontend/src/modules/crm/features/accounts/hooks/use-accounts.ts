import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Account {
  id: string
  name: string
  industry: string | null
  total_revenue: number
  status: string
  website: string | null
  address: string | null
  source_deal_id: string | null
  next_follow_up_date: string | null
  health_score: number
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedAccounts {
  items: Account[]
  total: number
  page: number
  page_size: number
}

interface AccountFilters {
  status?: string
  search?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/accounts`

export function useAccounts(workspaceId: string, filters: AccountFilters = {}) {
  const { status, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedAccounts>({
    queryKey: ['crm-accounts', workspaceId, { status, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useAccount(workspaceId: string, accountId: string) {
  return useQuery<Account>({
    queryKey: ['crm-accounts', workspaceId, accountId],
    queryFn: () => api.get(`${base(workspaceId)}/${accountId}`).then((r) => r.data),
    enabled: !!workspaceId && !!accountId,
  })
}

export function useAccount360(workspaceId: string, accountId: string) {
  return useQuery({
    queryKey: ['crm-accounts', workspaceId, accountId, '360'],
    queryFn: () => api.get(`${base(workspaceId)}/${accountId}/360`).then((r) => r.data),
    enabled: !!workspaceId && !!accountId,
  })
}

export function useCreateAccount(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-accounts', workspaceId] }),
  })
}

export function useUpdateAccount(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, ...data }: { accountId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${accountId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-accounts', workspaceId] }),
  })
}

export function useDeleteAccount(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => api.delete(`${base(workspaceId)}/${accountId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-accounts', workspaceId] }),
  })
}

export function useAccountFollowUps(workspaceId: string) {
  return useQuery({
    queryKey: ['crm-account-followups', workspaceId],
    queryFn: () =>
      api.get(`/crm/workspaces/${workspaceId}/accounts/follow-ups`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
