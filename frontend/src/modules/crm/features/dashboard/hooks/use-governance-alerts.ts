import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

export interface GovernanceAlerts {
  stale_deals_count: number
  stale_deals: { id: string; title: string; stage: string }[]
  stale_leads_count: number
  unassigned_leads: number
  overdue_tickets: number
}

export function useGovernanceAlerts() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useQuery<GovernanceAlerts>({
    queryKey: ['crm-governance', wsId],
    queryFn: () =>
      api.get(`/crm/workspaces/${wsId}/governance/alerts`).then((r) => r.data),
    enabled: !!wsId,
    retry: false,
  })
}
