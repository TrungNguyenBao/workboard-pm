import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Contract {
  id: string
  deal_id: string | null
  account_id: string
  contract_number: string
  title: string
  start_date: string | null
  end_date: string | null
  value: number
  billing_period: string | null
  auto_renewal: boolean
  status: 'draft' | 'active' | 'expired' | 'terminated'
  signed_date: string | null
  notes: string | null
  workspace_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedContracts {
  items: Contract[]
  total: number
  page: number
  page_size: number
}

interface ContractFilters {
  status?: string
  account_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
] as const

export const BILLING_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One Time' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/contracts`

export function useContracts(workspaceId: string, filters: ContractFilters = {}) {
  const { status, account_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedContracts>({
    queryKey: ['crm-contracts', workspaceId, { status, account_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, account_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contracts', workspaceId] }),
  })
}

export function useUpdateContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, ...data }: { contractId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${contractId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contracts', workspaceId] }),
  })
}

export function useActivateContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contractId: string) =>
      api.post(`${base(workspaceId)}/${contractId}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contracts', workspaceId] }),
  })
}

export function useTerminateContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contractId: string) =>
      api.post(`${base(workspaceId)}/${contractId}/terminate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contracts', workspaceId] }),
  })
}
