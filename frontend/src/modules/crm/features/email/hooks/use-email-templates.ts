import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  category: string
  merge_tags: Record<string, string> | null
  is_active: boolean
  created_by: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  contact_id: string | null
  deal_id: string | null
  lead_id: string | null
  template_id: string | null
  subject: string
  body: string
  direction: string
  status: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedEmailLogs {
  items: EmailLog[]
  total: number
  page: number
  page_size: number
}

interface EmailFilters {
  contact_id?: string
  deal_id?: string
  lead_id?: string
  page?: number
  page_size?: number
}

const tmplBase = (wsId: string) => `/crm/workspaces/${wsId}/email-templates`
const emailBase = (wsId: string) => `/crm/workspaces/${wsId}/emails`

export function useEmailTemplates(workspaceId: string, category?: string) {
  return useQuery<{ items: EmailTemplate[]; total: number; page: number; page_size: number }>({
    queryKey: ['crm-email-templates', workspaceId, category ?? null],
    queryFn: () =>
      api.get(tmplBase(workspaceId), { params: category ? { category } : {} }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useEmailTemplate(workspaceId: string, templateId: string) {
  return useQuery<EmailTemplate>({
    queryKey: ['crm-email-template', workspaceId, templateId],
    queryFn: () => api.get(`${tmplBase(workspaceId)}/${templateId}`).then((r) => r.data),
    enabled: !!workspaceId && !!templateId,
  })
}

export function useCreateEmailTemplate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(tmplBase(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-email-templates', workspaceId] }),
  })
}

export function useUpdateEmailTemplate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, ...data }: { templateId: string } & Record<string, unknown>) =>
      api.patch(`${tmplBase(workspaceId)}/${templateId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-email-templates', workspaceId] }),
  })
}

export function useDeleteEmailTemplate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) => api.delete(`${tmplBase(workspaceId)}/${templateId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-email-templates', workspaceId] }),
  })
}

export function useSendEmail(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      template_id: string
      contact_id: string
      deal_id?: string
      lead_id?: string
      merge_values?: Record<string, string>
    }) => api.post(`${emailBase(workspaceId)}/send`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-emails', workspaceId] }),
  })
}

export function useEmails(workspaceId: string, filters: EmailFilters = {}) {
  const { contact_id, deal_id, lead_id, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedEmailLogs>({
    queryKey: ['crm-emails', workspaceId, { contact_id, deal_id, lead_id, page, page_size }],
    queryFn: () =>
      api.get(emailBase(workspaceId), {
        params: { contact_id, deal_id, lead_id, page, page_size },
      }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
