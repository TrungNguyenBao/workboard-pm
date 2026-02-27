import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface CustomFieldOption {
  id: string
  label: string
  color: string
}

export interface CustomFieldDefinition {
  id: string
  project_id: string
  name: string
  field_type: 'text' | 'number' | 'date' | 'single_select' | 'multi_select' | 'checkbox' | 'url'
  required: boolean
  description: string | null
  options: CustomFieldOption[] | null
  position: number
  created_by_id: string
  created_at: string
}

export function useCustomFields(projectId: string) {
  return useQuery<CustomFieldDefinition[]>({
    queryKey: ['custom-fields', projectId],
    queryFn: () => api.get(`/projects/${projectId}/custom-fields`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useCreateCustomField(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CustomFieldDefinition>) =>
      api.post(`/projects/${projectId}/custom-fields`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', projectId] }),
  })
}

export function useUpdateCustomField(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fieldId, ...data }: { fieldId: string } & Partial<CustomFieldDefinition>) =>
      api.patch(`/projects/${projectId}/custom-fields/${fieldId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', projectId] }),
  })
}

export function useDeleteCustomField(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fieldId: string) =>
      api.delete(`/projects/${projectId}/custom-fields/${fieldId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', projectId] }),
  })
}
