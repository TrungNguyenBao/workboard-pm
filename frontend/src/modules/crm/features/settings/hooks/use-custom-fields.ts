import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface CrmCustomField {
  id: string
  entity_type: string
  field_name: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select'
  options: string[] | null
  is_required: boolean
  position: number
  workspace_id: string
  created_at: string
  updated_at: string
}

export type EntityType = 'lead' | 'deal' | 'contact' | 'account'

const base = (wsId: string) => `/crm/workspaces/${wsId}/custom-fields`
const qKey = (wsId: string, entityType?: string) =>
  ['crm-custom-fields', wsId, entityType ?? null]

export function useCustomFields(workspaceId: string, entityType?: EntityType) {
  return useQuery<CrmCustomField[]>({
    queryKey: qKey(workspaceId, entityType),
    queryFn: () =>
      api.get(base(workspaceId), { params: entityType ? { entity_type: entityType } : {} })
        .then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateCustomField(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-custom-fields', workspaceId] }),
  })
}

export function useUpdateCustomField(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fieldId, ...data }: { fieldId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${fieldId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-custom-fields', workspaceId] }),
  })
}

export function useDeleteCustomField(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fieldId: string) => api.delete(`${base(workspaceId)}/${fieldId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-custom-fields', workspaceId] }),
  })
}
