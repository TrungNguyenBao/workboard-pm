import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface BurndownPoint {
  date: string
  completed_points: number
  total_points: number
}

export interface VelocityPoint {
  sprint_id: string
  sprint_name: string
  completed_points: number
}

export function useBurndownData(projectId: string, sprintId: string | null) {
  return useQuery<BurndownPoint[]>({
    queryKey: ['burndown', projectId, sprintId],
    queryFn: () =>
      api
        .get(`/pms/projects/${projectId}/sprints/${sprintId}/burndown`)
        .then((r) => r.data),
    enabled: !!projectId && !!sprintId,
  })
}

export function useVelocityData(projectId: string) {
  return useQuery<VelocityPoint[]>({
    queryKey: ['velocity', projectId],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/velocity`).then((r) => r.data),
    enabled: !!projectId,
  })
}
