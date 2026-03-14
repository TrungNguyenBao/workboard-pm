import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { Deal } from './use-deals'

export function useDeal(workspaceId: string, dealId: string) {
  return useQuery<Deal>({
    queryKey: ['crm-deal', workspaceId, dealId],
    queryFn: () =>
      api.get(`/crm/workspaces/${workspaceId}/deals/${dealId}`).then((r) => r.data),
    enabled: !!workspaceId && !!dealId,
  })
}
