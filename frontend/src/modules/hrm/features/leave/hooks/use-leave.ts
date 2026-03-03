import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

// --- Leave Types ---

export interface LeaveType {
  id: string
  name: string
  days_per_year: number
  workspace_id: string
}

export interface PaginatedLeaveTypes {
  items: LeaveType[]
  total: number
  page: number
  page_size: number
}

const ltBase = (wsId: string) => `/hrm/workspaces/${wsId}/leave-types`

export function useLeaveTypes(workspaceId: string, filters: { search?: string; page?: number; page_size?: number } = {}) {
  const { search, page = 1, page_size = 50 } = filters
  return useQuery<PaginatedLeaveTypes>({
    queryKey: ['hrm-leave-types', workspaceId, { search, page, page_size }],
    queryFn: () => api.get(ltBase(workspaceId), { params: { search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateLeaveType(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(ltBase(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-types', workspaceId] }),
  })
}

export function useUpdateLeaveType(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leaveTypeId, ...data }: { leaveTypeId: string } & Record<string, unknown>) =>
      api.patch(`${ltBase(workspaceId)}/${leaveTypeId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-types', workspaceId] }),
  })
}

export function useDeleteLeaveType(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leaveTypeId: string) => api.delete(`${ltBase(workspaceId)}/${leaveTypeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-types', workspaceId] }),
  })
}

// --- Leave Requests ---

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days: number
  status: string
  reviewed_by_id: string | null
  workspace_id: string
}

export interface PaginatedLeaveRequests {
  items: LeaveRequest[]
  total: number
  page: number
  page_size: number
}

interface LeaveRequestFilters {
  employee_id?: string
  status?: string
  page?: number
  page_size?: number
}

const lrBase = (wsId: string) => `/hrm/workspaces/${wsId}/leave-requests`

export function useLeaveRequests(workspaceId: string, filters: LeaveRequestFilters = {}) {
  const { employee_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedLeaveRequests>({
    queryKey: ['hrm-leave-requests', workspaceId, { employee_id, status, page, page_size }],
    queryFn: () =>
      api.get(lrBase(workspaceId), { params: { employee_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateLeaveRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(lrBase(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-requests', workspaceId] }),
  })
}

export function useApproveLeaveRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leaveRequestId: string) =>
      api.post(`${lrBase(workspaceId)}/${leaveRequestId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-requests', workspaceId] }),
  })
}

export function useRejectLeaveRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leaveRequestId: string) =>
      api.post(`${lrBase(workspaceId)}/${leaveRequestId}/reject`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-requests', workspaceId] }),
  })
}

export function useDeleteLeaveRequest(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leaveRequestId: string) => api.delete(`${lrBase(workspaceId)}/${leaveRequestId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-leave-requests', workspaceId] }),
  })
}
