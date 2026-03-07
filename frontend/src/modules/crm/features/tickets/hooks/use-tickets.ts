import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Ticket {
  id: string
  subject: string
  description: string | null
  priority: string
  status: string
  contact_id: string | null
  account_id: string | null
  assigned_to: string | null
  resolved_at: string | null
  closed_at: string | null
  resolution_notes: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedTickets {
  items: Ticket[]
  total: number
  page: number
  page_size: number
}

interface TicketFilters {
  status?: string
  priority?: string
  contact_id?: string
  account_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/tickets`

export function useTickets(workspaceId: string, filters: TicketFilters = {}) {
  const { status, priority, contact_id, account_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedTickets>({
    queryKey: ['crm-tickets', workspaceId, { status, priority, contact_id, account_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, priority, contact_id, account_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateTicket(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tickets', workspaceId] }),
  })
}

export function useUpdateTicket(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, ...data }: { ticketId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${ticketId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tickets', workspaceId] }),
  })
}

export function useDeleteTicket(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => api.delete(`${base(workspaceId)}/${ticketId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tickets', workspaceId] }),
  })
}
