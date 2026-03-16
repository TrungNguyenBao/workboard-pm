import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface QuotationLine {
  id: string
  quotation_id: string
  product_service_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount_pct: number
  line_total: number
  position: number
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Quotation {
  id: string
  deal_id: string
  quote_number: string
  contact_id: string | null
  valid_until: string | null
  subtotal: number
  discount_pct: number
  discount_amount: number
  tax_pct: number
  tax_amount: number
  total: number
  status: string
  notes: string | null
  version: number
  created_by: string | null
  workspace_id: string
  lines: QuotationLine[]
  created_at: string
  updated_at: string
}

const quotationBase = (wsId: string) => `/crm/workspaces/${wsId}`

const quotationKeys = {
  byDeal: (wsId: string, dealId: string) => ['crm-quotations', wsId, dealId] as const,
  detail: (wsId: string, id: string) => ['crm-quotation', wsId, id] as const,
}

export function useQuotationsByDeal(workspaceId: string, dealId: string) {
  return useQuery<Quotation[]>({
    queryKey: quotationKeys.byDeal(workspaceId, dealId),
    queryFn: () =>
      api.get(`${quotationBase(workspaceId)}/deals/${dealId}/quotations`).then((r) => r.data),
    enabled: !!workspaceId && !!dealId,
  })
}

export function useCreateQuotation(workspaceId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(`${quotationBase(workspaceId)}/deals/${dealId}/quotations`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.byDeal(workspaceId, dealId) }),
  })
}

export function useUpdateQuotation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ quotationId, ...data }: { quotationId: string; dealId: string } & Record<string, unknown>) =>
      api.patch(`${quotationBase(workspaceId)}/quotations/${quotationId}`, data).then((r) => r.data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, vars.dealId] }),
  })
}

export function useSendQuotation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ quotationId }: { quotationId: string; dealId: string }) =>
      api.post(`${quotationBase(workspaceId)}/quotations/${quotationId}/send`).then((r) => r.data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, vars.dealId] }),
  })
}

export function useAcceptQuotation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ quotationId }: { quotationId: string; dealId: string }) =>
      api.post(`${quotationBase(workspaceId)}/quotations/${quotationId}/accept`).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, vars.dealId] })
      qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] })
    },
  })
}

export function useRejectQuotation(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ quotationId }: { quotationId: string; dealId: string }) =>
      api.post(`${quotationBase(workspaceId)}/quotations/${quotationId}/reject`).then((r) => r.data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, vars.dealId] }),
  })
}

export function useAddQuotationLine(workspaceId: string, quotationId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(`${quotationBase(workspaceId)}/quotations/${quotationId}/lines`, data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, dealId] }),
  })
}

export function useUpdateQuotationLine(workspaceId: string, quotationId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lineId, ...data }: { lineId: string } & Record<string, unknown>) =>
      api
        .patch(`${quotationBase(workspaceId)}/quotations/${quotationId}/lines/${lineId}`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, dealId] }),
  })
}

export function useDeleteQuotationLine(workspaceId: string, quotationId: string, dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lineId: string) =>
      api
        .delete(`${quotationBase(workspaceId)}/quotations/${quotationId}/lines/${lineId}`)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['crm-quotations', workspaceId, dealId] }),
  })
}
