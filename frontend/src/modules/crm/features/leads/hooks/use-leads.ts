import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string
  status: string
  score: number
  owner_id: string | null
  campaign_id: string | null
  contacted_at: string | null
  assigned_at: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedLeads {
  items: Lead[]
  total: number
  page: number
  page_size: number
}

interface LeadFilters {
  status?: string
  source?: string
  owner_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'ads', label: 'Ads' },
  { value: 'form', label: 'Form' },
  { value: 'referral', label: 'Referral' },
  { value: 'manual', label: 'Manual' },
] as const

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'lost', label: 'Lost' },
  { value: 'disqualified', label: 'Disqualified' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/leads`

export function useLeads(workspaceId: string, filters: LeadFilters = {}) {
  const { status, source, owner_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedLeads>({
    queryKey: ['crm-leads', workspaceId, { status, source, owner_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { status, source, owner_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateLead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export function useUpdateLead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, ...data }: { leadId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${leadId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export function useDeleteLead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leadId: string) => api.delete(`${base(workspaceId)}/${leadId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export function useConvertLead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leadId: string) =>
      api.post(`${base(workspaceId)}/${leadId}/convert`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] })
      qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] })
    },
  })
}

export function useDistributeLeads(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post(`${base(workspaceId)}/distribute`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export function useStaleLeads(workspaceId: string, hours = 48) {
  return useQuery({
    queryKey: ['crm-leads-stale', workspaceId, hours],
    queryFn: () =>
      api.get(`${base(workspaceId)}/stale`, { params: { hours } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
