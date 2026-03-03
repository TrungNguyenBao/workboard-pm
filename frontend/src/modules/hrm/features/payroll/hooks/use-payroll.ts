import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface PayrollRecord {
  id: string
  employee_id: string
  period: string
  gross: number
  net: number
  deductions: Record<string, number> | null
  status: string
  workspace_id: string
}

export interface PaginatedPayroll {
  items: PayrollRecord[]
  total: number
  page: number
  page_size: number
}

interface PayrollFilters {
  employee_id?: string
  period?: string
  status?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/payroll-records`

export function usePayrollRecords(workspaceId: string, filters: PayrollFilters = {}) {
  const { employee_id, period, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedPayroll>({
    queryKey: ['hrm-payroll', workspaceId, { employee_id, period, status, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id, period, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreatePayrollRecord(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-payroll', workspaceId] }),
  })
}

export function useUpdatePayrollRecord(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, ...data }: { recordId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${recordId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-payroll', workspaceId] }),
  })
}

export function useDeletePayrollRecord(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) => api.delete(`${base(workspaceId)}/${recordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-payroll', workspaceId] }),
  })
}
