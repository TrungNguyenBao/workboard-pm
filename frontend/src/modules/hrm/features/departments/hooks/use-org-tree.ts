import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface DepartmentTreeNode {
  id: string
  name: string
  description: string | null
  parent_department_id: string | null
  manager_id: string | null
  manager_name: string | null
  employee_count: number
  children: DepartmentTreeNode[]
}

export interface HeadcountSummary {
  department_id: string
  department_name: string
  total_positions: number
  filled_count: number
  open_positions: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/departments`

export function useOrgTree(workspaceId: string) {
  return useQuery<DepartmentTreeNode[]>({
    queryKey: ['hrm-org-tree', workspaceId],
    queryFn: () => api.get(`${base(workspaceId)}/tree`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useHeadcount(workspaceId: string) {
  return useQuery<HeadcountSummary[]>({
    queryKey: ['hrm-headcount', workspaceId],
    queryFn: () => api.get(`${base(workspaceId)}/headcount`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
