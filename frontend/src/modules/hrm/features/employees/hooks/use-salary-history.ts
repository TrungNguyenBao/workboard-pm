import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface SalaryHistory {
  id: string
  employee_id: string
  effective_date: string
  previous_amount: number
  new_amount: number
  reason: string
  approved_by_id: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedSalaryHistory {
  items: SalaryHistory[]
  total: number
  page: number
  page_size: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/salary-history`

export function useSalaryHistory(workspaceId: string, employeeId: string) {
  return useQuery<PaginatedSalaryHistory>({
    queryKey: ['hrm-salary-history', workspaceId, employeeId],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id: employeeId, page_size: 50 } }).then((r) => r.data),
    enabled: !!workspaceId && !!employeeId,
  })
}
