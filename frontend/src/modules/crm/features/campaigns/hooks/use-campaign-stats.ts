import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Campaign } from './use-campaigns'

export interface CampaignStats {
  campaign: Campaign
  total_leads: number
  converted_leads: number
  conversion_rate: number
  won_deal_value: number
  cost_per_lead: number
  roi_percent: number
}

export function useCampaignStats(workspaceId: string, campaignId: string) {
  return useQuery<CampaignStats>({
    queryKey: ['crm-campaign-stats', workspaceId, campaignId],
    queryFn: () =>
      api
        .get(`/crm/workspaces/${workspaceId}/campaigns/${campaignId}/stats`)
        .then((r) => r.data),
    enabled: !!workspaceId && !!campaignId,
  })
}
