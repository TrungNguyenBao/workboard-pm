import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { DEAL_STAGES } from '@/modules/crm/features/deals/hooks/use-deals'
import api from '@/shared/lib/api'

export interface CrmAnalytics {
  total_contacts: number
  total_deals: number
  total_leads: number
  total_activities: number
  pipeline_value: number
  deals_won: number
  deals_lost: number
  win_rate: number
  stage_values: Record<string, number>
  stage_counts: Record<string, number>
  lead_source_counts: Record<string, number>
  lead_status_counts: Record<string, number>
  lead_conversion_rate: number
  total_campaign_budget: number
  total_campaign_cost: number
  open_tickets: number
}

interface StageBar { name: string; count: number }

export function useCrmStats() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const wsId = activeWorkspaceId ?? ''

  const analyticsQuery = useQuery<CrmAnalytics>({
    queryKey: ['crm-analytics', wsId],
    queryFn: () => api.get(`/crm/workspaces/${wsId}/analytics`).then((r) => r.data),
    enabled: !!wsId,
  })

  const analytics = analyticsQuery.data

  const stageBars: StageBar[] = DEAL_STAGES.map((s) => ({
    name: s.label,
    count: analytics?.stage_counts[s.value] ?? 0,
  }))

  const leadSourceBars = Object.entries(analytics?.lead_source_counts ?? {}).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    count,
  }))

  const stats = {
    totalContacts: analytics?.total_contacts ?? 0,
    totalDeals: analytics?.total_deals ?? 0,
    totalLeads: analytics?.total_leads ?? 0,
    totalActivities: analytics?.total_activities ?? 0,
    pipelineValue: analytics?.pipeline_value ?? 0,
    dealsWon: analytics?.deals_won ?? 0,
    dealsLost: analytics?.deals_lost ?? 0,
    winRate: analytics?.win_rate ?? 0,
    leadConversionRate: analytics?.lead_conversion_rate ?? 0,
    totalCampaignBudget: analytics?.total_campaign_budget ?? 0,
    totalCampaignCost: analytics?.total_campaign_cost ?? 0,
    openTickets: analytics?.open_tickets ?? 0,
  }

  return { stats, stageBars, leadSourceBars, isLoading: analyticsQuery.isLoading }
}
