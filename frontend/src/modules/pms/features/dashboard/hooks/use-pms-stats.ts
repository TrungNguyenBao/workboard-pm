import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Project { id: string; name: string }

interface PmsStats {
  totalTasks: number
  overdueTasks: number
  completedThisWeek: number
  totalProjects: number
}

export function usePmsStats() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)

  const tasksQuery = useQuery<Task[]>({
    queryKey: ['my-tasks', activeWorkspaceId],
    queryFn: () => api.get(`/workspaces/${activeWorkspaceId}/tasks/my`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  const projectsQuery = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => api.get(`/pms/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
    staleTime: 60_000,
  })

  const tasks = tasksQuery.data ?? []
  const projects = projectsQuery.data ?? []

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)

  const stats: PmsStats = {
    totalTasks: tasks.length,
    overdueTasks: tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length,
    completedThisWeek: tasks.filter((t) => t.status === 'completed' && t.updated_at && new Date(t.updated_at) >= weekAgo).length,
    totalProjects: projects.length,
  }

  return {
    stats,
    tasks,
    isLoading: tasksQuery.isLoading || projectsQuery.isLoading,
  }
}
