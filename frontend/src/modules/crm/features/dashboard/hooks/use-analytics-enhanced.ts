import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface FunnelConversion {
  total_leads: number
  qualified: number
  opportunity: number
  closed_won: number
  lead_to_qualified_pct: number
  qualified_to_opportunity_pct: number
  opportunity_to_closed_pct: number
  overall_conversion_pct: number
}

export interface TopDeal {
  id: string
  title: string
  value: number
  stage: string
  owner_id: string | null
  expected_close_date: string | null
}

export interface VelocityDetail {
  overall_avg_days: number
  by_owner: { owner_id: string; avg_days: number; deals_count: number }[]
  bottleneck: { owner_id: string; avg_days: number; deals_count: number } | null
  total_closed_won: number
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/analytics`

export function useRevenueTrend(months = 6) {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useQuery<MonthlyRevenue[]>({
    queryKey: ['crm-revenue-trend', wsId, months],
    queryFn: () => api.get(`${base(wsId)}/revenue-trend`, { params: { months } }).then((r) => r.data),
    enabled: !!wsId,
  })
}

export function useFunnelConversion() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useQuery<FunnelConversion>({
    queryKey: ['crm-funnel-conversion', wsId],
    queryFn: () => api.get(`${base(wsId)}/funnel-conversion`).then((r) => r.data),
    enabled: !!wsId,
  })
}

export function useTopDeals(limit = 5) {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useQuery<TopDeal[]>({
    queryKey: ['crm-top-deals', wsId, limit],
    queryFn: () => api.get(`${base(wsId)}/top-deals`, { params: { limit } }).then((r) => r.data),
    enabled: !!wsId,
  })
}

export function useVelocityDetail() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useQuery<VelocityDetail>({
    queryKey: ['crm-velocity-detail', wsId],
    queryFn: () => api.get(`${base(wsId)}/velocity-detail`).then((r) => r.data),
    enabled: !!wsId,
  })
}
