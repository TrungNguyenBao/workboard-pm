import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Contract {
  id: string
  employee_id: string
  contract_type: string
  start_date: string
  end_date: string | null
  base_salary: number
  allowances: Record<string, unknown> | null
  status: string
  file_url: string | null
  notes: string | null
  workspace_id: string
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
  employee_id?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/contracts`

export function useContracts(workspaceId: string, filters: ContractFilters = {}) {
  const { employee_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedContracts>({
    queryKey: ['hrm-contracts', workspaceId, { employee_id, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-contracts', workspaceId] }),
  })
}

export function useUpdateContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, ...data }: { contractId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${contractId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-contracts', workspaceId] }),
  })
}

export function useDeleteContract(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contractId: string) => api.delete(`${base(workspaceId)}/${contractId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-contracts', workspaceId] }),
  })
}
