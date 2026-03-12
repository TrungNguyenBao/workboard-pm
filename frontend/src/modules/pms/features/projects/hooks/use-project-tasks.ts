import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Section {
  id: string
  project_id: string
  name: string
  color: string | null
  position: number
  wip_limit: number | null
}

export interface Task {
  id: string
  project_id: string
  section_id: string | null
  assignee_id: string | null
  created_by_id: string
  parent_id: string | null
  title: string
  description: string | null
  status: string
  priority: string
  position: number
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Recurrence fields
  recurrence_rule: string | null
  recurrence_cron_expr: string | null
  recurrence_end_date: string | null
  parent_recurring_id: string | null
  // Enriched fields
  assignee_name: string | null
  assignee_avatar_url: string | null
  subtask_count: number
  completed_subtask_count: number
  // Tags
  tags: { id: string; name: string; color: string }[]
  // Custom fields
  custom_fields: Record<string, unknown> | null
  // Agile fields
  story_points: number | null
  task_type: string
  sprint_id: string | null
  epic_id: string | null
  // Dependencies
  blocked_by_count: number
  blocking_task_ids: string[]
}

export function useSections(projectId: string) {
  return useQuery<Section[]>({
    queryKey: ['sections', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}/sections`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useTasks(projectId: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}/tasks`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Task>) =>
      api.post(`/pms/projects/${projectId}/tasks`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}

export function useCreateSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; position?: number }) =>
      api.post(`/pms/projects/${projectId}/sections`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections', projectId] }),
  })
}

export function useUpdateSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sectionId, name }: { sectionId: string; name: string }) =>
      api.patch(`/pms/projects/${projectId}/sections/${sectionId}`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections', projectId] }),
  })
}

export function useDeleteSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sectionId: string) =>
      api.delete(`/pms/projects/${projectId}/sections/${sectionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Record<string, unknown>) =>
      api.patch(`/pms/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['backlog', projectId] })
      qc.invalidateQueries({ queryKey: ['sprints', projectId] })
    },
  })
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, sectionId, position }: { taskId: string; sectionId: string | null; position: number }) =>
      api.patch(`/pms/projects/${projectId}/tasks/${taskId}/move`, { section_id: sectionId, position }).then((r) => r.data),
    onMutate: async ({ taskId, sectionId, position }) => {
      await qc.cancelQueries({ queryKey: ['tasks', projectId] })
      const prev = qc.getQueryData<Task[]>(['tasks', projectId])
      qc.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old?.map((t) =>
          t.id === taskId ? { ...t, section_id: sectionId, position } : t
        ) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', projectId], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}
