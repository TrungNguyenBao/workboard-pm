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

export interface LeadCreateResponse {
  lead: Lead
  duplicates: Lead[] | null
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
  return useMutation<LeadCreateResponse, Error, Record<string, unknown>>({
    mutationFn: (data) =>
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

export function useMergeLeads(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation<Lead, Error, { keep_id: string; merge_id: string }>({
    mutationFn: (data) =>
      api.post(`${base(workspaceId)}/merge`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export interface LeadConvertPayload {
  leadId: string
  deal_title?: string
  value?: number
  expected_close_date?: string
  create_contact?: boolean
}

export function useConvertLead(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, ...body }: LeadConvertPayload) =>
      api.post(`${base(workspaceId)}/${leadId}/convert`, body).then((r) => r.data),
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

export function useStaleLeads(workspaceId: string, days = 30) {
  return useQuery({
    queryKey: ['crm-leads-stale', workspaceId, days],
    queryFn: () =>
      api.get(`${base(workspaceId)}/stale`, { params: { days } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export interface BantValues {
  _bant_budget?: string
  _bant_authority?: string
  _bant_need?: string
  _bant_timeline?: string
}

export function useUpdateLeadBant(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, ...bant }: { leadId: string } & BantValues) =>
      api.patch(`${base(workspaceId)}/${leadId}/bant`, bant).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export function useBulkDisqualify(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation<{ disqualified: number }, Error, { lead_ids: string[]; reason: string }>({
    mutationFn: (data) =>
      api.post(`${base(workspaceId)}/bulk-disqualify`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}
