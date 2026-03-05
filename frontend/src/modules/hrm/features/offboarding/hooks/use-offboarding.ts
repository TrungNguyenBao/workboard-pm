import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

// --- Resignations ---

export interface Resignation {
  id: string
  employee_id: string
  resignation_date: string
  last_working_day: string
  reason: string | null
  status: string
  approved_by_id: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedResignations {
  items: Resignation[]
  total: number
  page: number
  page_size: number
}

const rBase = (wsId: string) => `/hrm/workspaces/${wsId}/resignations`

export function useResignations(
  workspaceId: string,
  filters: { employee_id?: string; status?: string; page?: number; page_size?: number } = {},
) {
  const { employee_id, status, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedResignations>({
    queryKey: ['hrm-resignations', workspaceId, { employee_id, status, page, page_size }],
    queryFn: () =>
      api.get(rBase(workspaceId), { params: { employee_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateResignation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(rBase(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-resignations', workspaceId] }),
  })
}

export function useApproveResignation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (resignationId: string) =>
      api.post(`${rBase(workspaceId)}/${resignationId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-resignations', workspaceId] }),
  })
}

export function useRejectResignation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (resignationId: string) =>
      api.post(`${rBase(workspaceId)}/${resignationId}/reject`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-resignations', workspaceId] }),
  })
}

// --- Handover Tasks ---

export interface HandoverTask {
  id: string
  resignation_id: string
  task_name: string
  from_employee_id: string | null
  to_employee_id: string | null
  status: string
  due_date: string | null
  notes: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedHandoverTasks {
  items: HandoverTask[]
  total: number
  page: number
  page_size: number
}

const htBase = (wsId: string) => `/hrm/workspaces/${wsId}/handover-tasks`

export function useHandoverTasks(
  workspaceId: string,
  filters: { resignation_id?: string; status?: string; page?: number; page_size?: number } = {},
) {
  const { resignation_id, status, page = 1, page_size = 50 } = filters
  return useQuery<PaginatedHandoverTasks>({
    queryKey: ['hrm-handover-tasks', workspaceId, { resignation_id, status, page, page_size }],
    queryFn: () =>
      api.get(htBase(workspaceId), { params: { resignation_id, status, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateHandoverTask(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(htBase(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-handover-tasks', workspaceId] }),
  })
}

export function useUpdateHandoverTask(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Record<string, unknown>) =>
      api.patch(`${htBase(workspaceId)}/${taskId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-handover-tasks', workspaceId] }),
  })
}

// --- Exit Interviews ---

export interface ExitInterview {
  id: string
  resignation_id: string
  interviewer_id: string | null
  feedback: Record<string, unknown> | null
  conducted_at: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

const eiBase = (wsId: string) => `/hrm/workspaces/${wsId}/exit-interviews`

export function useExitInterview(workspaceId: string, resignationId: string) {
  return useQuery<ExitInterview>({
    queryKey: ['hrm-exit-interview', workspaceId, resignationId],
    queryFn: () =>
      api.get(`${eiBase(workspaceId)}/by-resignation/${resignationId}`).then((r) => r.data),
    enabled: !!workspaceId && !!resignationId,
    retry: false,
  })
}

export function useCreateExitInterview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(eiBase(workspaceId), data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['hrm-exit-interview', workspaceId, vars.resignation_id as string] })
    },
  })
}

export function useUpdateExitInterview(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ exitInterviewId, ...data }: { exitInterviewId: string } & Record<string, unknown>) =>
      api.patch(`${eiBase(workspaceId)}/${exitInterviewId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hrm-exit-interview', workspaceId] }),
  })
}
