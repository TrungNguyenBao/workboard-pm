import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

export interface DashboardByProject {
  project_name: string
  project_color: string
  total: number
  completed: number
}

export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  active_sprints: number
  tasks_completed_this_week: number
  by_project: DashboardByProject[]
  by_priority: { high: number; medium: number; low: number; none: number }
}

const EMPTY_STATS: DashboardStats = {
  total_tasks: 0,
  completed_tasks: 0,
  overdue_tasks: 0,
  active_sprints: 0,
  tasks_completed_this_week: 0,
  by_project: [],
  by_priority: { high: 0, medium: 0, low: 0, none: 0 },
}

export function usePmsStats() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)

  const query = useQuery<DashboardStats>({
    queryKey: ['pms-dashboard', activeWorkspaceId],
    queryFn: () =>
      api
        .get(`/pms/workspaces/${activeWorkspaceId}/pms/dashboard`)
        .then((r) => r.data),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
  })

  return {
    stats: query.data ?? EMPTY_STATS,
    isLoading: query.isLoading,
  }
}
