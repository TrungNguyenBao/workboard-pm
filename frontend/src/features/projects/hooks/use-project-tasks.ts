import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Section {
  id: string
  project_id: string
  name: string
  color: string | null
  position: number
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
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function useSections(projectId: string) {
  return useQuery<Section[]>({
    queryKey: ['sections', projectId],
    queryFn: () => api.get(`/projects/${projectId}/sections`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useTasks(projectId: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Task>) =>
      api.post(`/projects/${projectId}/tasks`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}

export function useCreateSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; position?: number }) =>
      api.post(`/projects/${projectId}/sections`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections', projectId] }),
  })
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, sectionId, position }: { taskId: string; sectionId: string | null; position: number }) =>
      api.patch(`/projects/${projectId}/tasks/${taskId}/move`, { section_id: sectionId, position }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}
