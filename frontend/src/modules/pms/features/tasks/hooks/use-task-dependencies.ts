import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface DependencyResponse {
  id: string
  blocking_task_id: string
  blocked_task_id: string
  dependency_type: string
  blocking_task_title: string
  blocked_task_title: string
}

const depKey = (projectId: string, taskId: string) => ['dependencies', projectId, taskId]

export function useTaskDependencies(projectId: string, taskId: string) {
  return useQuery<DependencyResponse[]>({
    queryKey: depKey(projectId, taskId),
    queryFn: () =>
      api
        .get(`/pms/projects/${projectId}/tasks/${taskId}/dependencies`)
        .then((r) => r.data),
    enabled: !!projectId && !!taskId,
  })
}

export function useAddDependency(projectId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blocking_task_id: string) =>
      api
        .post(`/pms/projects/${projectId}/tasks/${taskId}/dependencies`, {
          blocking_task_id,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: depKey(projectId, taskId) }),
  })
}

export function useRemoveDependency(projectId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dependencyId: string) =>
      api.delete(
        `/pms/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: depKey(projectId, taskId) }),
  })
}
