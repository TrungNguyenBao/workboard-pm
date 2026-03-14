import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Contact } from './use-contacts'

export interface Contact360 {
  contact: Contact
  deals: Array<{ id: string; title: string; stage: string; value: number }>
  activities: Array<{ id: string; type: string; subject: string; date: string; outcome: string | null }>
  emails: Array<{ id: string; subject: string; direction: string; status: string; sent_at: string }>
  tickets: Array<{ id: string; subject: string; priority: string; status: string }>
}

export function useContact360(workspaceId: string, contactId: string) {
  return useQuery<Contact360>({
    queryKey: ['crm-contact-360', workspaceId, contactId],
    queryFn: () =>
      api
        .get(`/crm/workspaces/${workspaceId}/contacts/${contactId}/360`)
        .then((r) => r.data),
    enabled: !!workspaceId && !!contactId,
  })
}
