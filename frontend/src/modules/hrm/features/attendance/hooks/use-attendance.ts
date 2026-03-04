import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  total_hours: number | null
  overtime_hours: number
  notes: string | null
  workspace_id: string
}

export interface AttendanceSummary {
  employee_id: string
  employee_name: string
  period: string
  present_days: number
  absent_days: number
  late_days: number
  half_day_count: number
  holiday_count: number
  leave_count: number
  total_hours: number
  overtime_hours: number
}

export interface PaginatedAttendance {
  items: AttendanceRecord[]
  total: number
  page: number
  page_size: number
}

interface AttendanceFilters {
  employee_id?: string
  period?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/hrm/workspaces/${wsId}/attendance-records`

export function useAttendance(workspaceId: string, filters: AttendanceFilters = {}) {
  const { employee_id, period, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedAttendance>({
    queryKey: ['hrm-attendance', workspaceId, { employee_id, period, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { employee_id, period, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useAttendanceSummary(workspaceId: string, period: string) {
  return useQuery<AttendanceSummary[]>({
    queryKey: ['hrm-attendance-summary', workspaceId, period],
    queryFn: () =>
      api.get(`${base(workspaceId)}/summary`, { params: { period } }).then((r) => r.data),
    enabled: !!workspaceId && !!period,
  })
}

export function useCreateAttendance(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-attendance', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-attendance-summary', workspaceId] })
    },
  })
}

export function useUpdateAttendance(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, ...data }: { recordId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${recordId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-attendance', workspaceId] }),
  })
}

export function useDeleteAttendance(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) => api.delete(`${base(workspaceId)}/${recordId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrm-attendance', workspaceId] })
      qc.invalidateQueries({ queryKey: ['hrm-attendance-summary', workspaceId] })
    },
  })
}
