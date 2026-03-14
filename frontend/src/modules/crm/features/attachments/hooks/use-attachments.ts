import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface CrmAttachment {
  id: string
  entity_type: string
  entity_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  category: string | null
  uploaded_by: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export const ATTACHMENT_CATEGORIES = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'contract', label: 'Contract' },
  { value: 'nda', label: 'NDA' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'other', label: 'Other' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/attachments`

export function useAttachments(workspaceId: string, entityType: string, entityId: string) {
  return useQuery<CrmAttachment[]>({
    queryKey: ['crm-attachments', workspaceId, entityType, entityId],
    queryFn: () =>
      api.get(base(workspaceId), { params: { entity_type: entityType, entity_id: entityId } }).then((r) => r.data),
    enabled: !!workspaceId && !!entityType && !!entityId,
  })
}

export function useUploadAttachment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      entityType,
      entityId,
      category,
    }: {
      file: File
      entityType: string
      entityId: string
      category?: string
    }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('entity_type', entityType)
      form.append('entity_id', entityId)
      if (category) form.append('category', category)
      return api
        .post(base(workspaceId), form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((r) => r.data)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ['crm-attachments', workspaceId, vars.entityType, vars.entityId],
      })
    },
  })
}

export function useDeleteAttachment(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      attachmentId,
      entityType: _entityType,
      entityId: _entityId,
    }: {
      attachmentId: string
      entityType: string
      entityId: string
    }) => api.delete(`${base(workspaceId)}/${attachmentId}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ['crm-attachments', workspaceId, vars.entityType, vars.entityId],
      })
    },
  })
}
