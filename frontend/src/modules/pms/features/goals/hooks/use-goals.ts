import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Goal {
  id: string
  workspace_id: string
  owner_id: string
  title: string
  description: string | null
  status: string
  progress_value: number
  calculation_method: string
  color: string
  due_date: string | null
  created_at: string
  updated_at: string
  owner_name: string | null
  linked_project_count: number
  linked_task_count: number
}

export interface LinkedProject {
  id: string
  name: string
  color: string
}

export interface LinkedTask {
  id: string
  title: string
  status: string
}

const base = (wsId: string) => `/pms/workspaces/${wsId}/goals`

export function useGoals(workspaceId: string) {
  return useQuery<Goal[]>({
    queryKey: ['goals', workspaceId],
    queryFn: () => api.get(base(workspaceId)).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useGoalLinkedProjects(workspaceId: string, goalId: string) {
  return useQuery<LinkedProject[]>({
    queryKey: ['goal-projects', goalId],
    queryFn: () => api.get(`${base(workspaceId)}/${goalId}/projects`).then((r) => r.data),
    enabled: !!goalId,
  })
}

export function useGoalLinkedTasks(workspaceId: string, goalId: string) {
  return useQuery<LinkedTask[]>({
    queryKey: ['goal-tasks', goalId],
    queryFn: () => api.get(`${base(workspaceId)}/${goalId}/tasks`).then((r) => r.data),
    enabled: !!goalId,
  })
}

export function useCreateGoal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', workspaceId] }),
  })
}

export function useUpdateGoal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, ...data }: { goalId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${goalId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', workspaceId] }),
  })
}

export function useDeleteGoal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => api.delete(`${base(workspaceId)}/${goalId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', workspaceId] }),
  })
}

export function useLinkProject(workspaceId: string, goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      api.post(`${base(workspaceId)}/${goalId}/projects`, { project_id: projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', workspaceId] })
      qc.invalidateQueries({ queryKey: ['goal-projects', goalId] })
    },
  })
}

export function useUnlinkProject(workspaceId: string, goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      api.delete(`${base(workspaceId)}/${goalId}/projects/${projectId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', workspaceId] })
      qc.invalidateQueries({ queryKey: ['goal-projects', goalId] })
    },
  })
}

export function useLinkTask(workspaceId: string, goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) =>
      api.post(`${base(workspaceId)}/${goalId}/tasks`, { task_id: taskId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', workspaceId] })
      qc.invalidateQueries({ queryKey: ['goal-tasks', goalId] })
    },
  })
}

export function useUnlinkTask(workspaceId: string, goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) =>
      api.delete(`${base(workspaceId)}/${goalId}/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', workspaceId] })
      qc.invalidateQueries({ queryKey: ['goal-tasks', goalId] })
    },
  })
}
