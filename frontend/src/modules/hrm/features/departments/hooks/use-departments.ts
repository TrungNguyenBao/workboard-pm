import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Department {
  id: string
  name: string
  description: string | null
  workspace_id: string
}

export interface PaginatedDepartments {
  items: Department[]
  total: number
  page: number
  page_size: number
}

interface DepartmentFilters {
  search?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/departments`

export function useDepartments(workspaceId: string, filters: DepartmentFilters = {}) {
  const { search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedDepartments>({
    queryKey: ['hrm-departments', workspaceId, { search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateDepartment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-departments', workspaceId] }),
  })
}

export function useUpdateDepartment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ departmentId, ...data }: { departmentId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${departmentId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-departments', workspaceId] }),
  })
}

export function useDeleteDepartment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (departmentId: string) => api.delete(`${base(workspaceId)}/${departmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-departments', workspaceId] }),
  })
}
