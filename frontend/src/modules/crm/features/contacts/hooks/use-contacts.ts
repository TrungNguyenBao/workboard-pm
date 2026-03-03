import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedContacts {
  items: Contact[]
  total: number
  page: number
  page_size: number
}

interface ContactFilters {
  search?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/contacts`

export function useContacts(workspaceId: string, filters: ContactFilters = {}) {
  const { search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedContacts>({
    queryKey: ['crm-contacts', workspaceId, { search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateContact(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts', workspaceId] }),
  })
}

export function useUpdateContact(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, ...data }: { contactId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${contactId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts', workspaceId] }),
  })
}

export function useDeleteContact(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contactId: string) => api.delete(`${base(workspaceId)}/${contactId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts', workspaceId] }),
  })
}
