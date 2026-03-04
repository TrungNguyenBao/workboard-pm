import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface InsuranceRecord {
  id: string
  employee_id: string
  insurance_type: string
  base_salary: number
  employee_rate: number
  employer_rate: number
  effective_from: string
  effective_to: string | null
  workspace_id: string
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/insurance-records`

export function useInsurance(workspaceId: string, employeeId?: string) {
  return useQuery<InsuranceRecord[]>({
    queryKey: ['hrm-insurance', workspaceId, employeeId],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id: employeeId } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateInsurance(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-insurance', workspaceId] }),
  })
}

export function useUpdateInsurance(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, ...data }: { recordId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${recordId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-insurance', workspaceId] }),
  })
}

export function useDeleteInsurance(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) => api.delete(`${base(workspaceId)}/${recordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-insurance', workspaceId] }),
  })
}
