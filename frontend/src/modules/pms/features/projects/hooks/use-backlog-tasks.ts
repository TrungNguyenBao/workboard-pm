import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Task } from './use-project-tasks'

export function useBacklogTasks(projectId: string) {
  return useQuery<Task[]>({
    queryKey: ['backlog', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}/backlog`).then((r) => r.data),
    enabled: !!projectId,
  })
}
