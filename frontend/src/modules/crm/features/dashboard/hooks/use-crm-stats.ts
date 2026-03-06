import { useWorkspaceStore } from '@/stores/workspace.store'
import { useContacts } from '@/modules/crm/features/contacts/hooks/use-contacts'
import { useDeals, DEAL_STAGES } from '@/modules/crm/features/deals/hooks/use-deals'

interface CrmStats {
  totalContacts: number
  totalDeals: number
  pipelineValue: number
  dealsWon: number
}

interface StageBar { name: string; count: number }

export function useCrmStats() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const wsId = activeWorkspaceId ?? ''

  const contactsQuery = useContacts(wsId, { page_size: 1 })
  const dealsQuery = useDeals(wsId, { page_size: 200 })

  const deals = dealsQuery.data?.items ?? []

  const pipelineValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const dealsWon = deals.filter((d) => d.stage === 'closed_won').length

  const stageCounts: Record<string, number> = {}
  for (const d of deals) {
    stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1
  }

  const stageBars: StageBar[] = DEAL_STAGES.map((s) => ({
    name: s.label,
    count: stageCounts[s.value] ?? 0,
  }))

  const stats: CrmStats = {
    totalContacts: contactsQuery.data?.total ?? 0,
    totalDeals: dealsQuery.data?.total ?? 0,
    pipelineValue,
    dealsWon,
  }

  const isLoading = contactsQuery.isLoading || dealsQuery.isLoading

  return { stats, stageBars, isLoading }
}
