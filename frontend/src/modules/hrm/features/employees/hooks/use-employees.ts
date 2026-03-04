import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Contract } from './use-contracts'
import type { SalaryHistory } from './use-salary-history'

export interface Employee {
  id: string
  name: string
  email: string
  department_id: string | null
  position: string | null
  hire_date: string | null
  user_id: string | null
  workspace_id: string
}

export interface PaginatedEmployees {
  items: Employee[]
  total: number
  page: number
  page_size: number
}

interface EmployeeFilters {
  search?: string
  department_id?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/employees`

export function useEmployees(workspaceId: string, filters: EmployeeFilters = {}) {
  const { search, department_id, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedEmployees>({
    queryKey: ['hrm-employees', workspaceId, { search, department_id, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, department_id, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateEmployee(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-employees', workspaceId] }),
  })
}

export function useUpdateEmployee(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, ...data }: { employeeId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${employeeId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-employees', workspaceId] }),
  })
}

export interface EmployeeDetail extends Employee {
  active_contract: Contract | null
  recent_salary_changes: SalaryHistory[]
  leave_balance: Record<string, { total: number; used: number; remaining: number }>
}

export function useEmployeeDetail(workspaceId: string, employeeId: string) {
  return useQuery<EmployeeDetail>({
    queryKey: ['hrm-employee-detail', workspaceId, employeeId],
    queryFn: () =>
      api.get(`${base(workspaceId)}/${employeeId}/detail`).then((r) => r.data),
    enabled: !!workspaceId && !!employeeId,
  })
}

export function useDeleteEmployee(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (employeeId: string) => api.delete(`${base(workspaceId)}/${employeeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-employees', workspaceId] }),
  })
}
