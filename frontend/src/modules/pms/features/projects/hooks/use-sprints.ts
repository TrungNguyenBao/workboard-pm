import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { toast } from '@/shared/components/ui/toast'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: string
  created_by_id: string
  created_at: string
  updated_at: string
  task_count: number
  completed_points: number
  total_points: number
}

export function useSprints(projectId: string, statusFilter?: string) {
  const params = statusFilter ? `?status=${statusFilter}` : ''
  return useQuery<Sprint[]>({
    queryKey: ['sprints', projectId, statusFilter],
    queryFn: () => api.get(`/pms/projects/${projectId}/sprints${params}`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useActiveSprint(projectId: string) {
  const { data: sprints = [] } = useSprints(projectId, 'active')
  return sprints[0] ?? null
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; goal?: string; start_date?: string; end_date?: string }) =>
      api.post(`/pms/projects/${projectId}/sprints`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
    onError: () => toast({ title: 'Failed to create sprint', variant: 'error' }),
  })
}

export function useStartSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) =>
      api.post(`/pms/projects/${projectId}/sprints/${sprintId}/start`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
    onError: () => toast({ title: 'Failed to start sprint', variant: 'error' }),
  })
}

export function useCompleteSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) =>
      api.post(`/pms/projects/${projectId}/sprints/${sprintId}/complete`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
    onError: () => toast({ title: 'Failed to complete sprint', variant: 'error' }),
  })
}
