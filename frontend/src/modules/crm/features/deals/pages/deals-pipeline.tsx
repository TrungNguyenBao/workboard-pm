import { useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { DEAL_STAGES, useDeals, type Deal } from '../hooks/use-deals'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { DealCard } from '../components/deal-card'

const STAGE_COLORS: Record<string, string> = {
  lead: '#94A3B8',
  qualified: '#38BDF8',
  needs_analysis: '#2563EB',
  proposal: '#1D4ED8',
  negotiation: '#F59E0B',
  closed_won: '#22C55E',
  closed_lost: '#EF4444',
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value}`
}

export default function DealsPipelinePage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: dealsData, isLoading } = useDeals(workspaceId, { page_size: 200 })
  const { data: contactsData } = useContacts(workspaceId, { page_size: 200 })

  const contactMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of contactsData?.items ?? []) map.set(c.id, c.name)
    return map
  }, [contactsData])

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {}
    for (const stage of DEAL_STAGES) grouped[stage.value] = []
    for (const deal of dealsData?.items ?? []) {
      if (grouped[deal.stage]) grouped[deal.stage].push(deal)
      else if (grouped['lead']) grouped['lead'].push(deal)
    }
    return grouped
  }, [dealsData])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-7 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-64 h-96 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-foreground mb-4">Pipeline</h2>
      <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
        {DEAL_STAGES.map((stage) => {
          const deals = dealsByStage[stage.value] ?? []
          const stageTotal = deals.reduce((sum, d) => sum + d.value, 0)
          return (
            <div key={stage.value} className="flex-shrink-0 w-64 flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage.value] }} />
                  <span className="text-sm font-medium">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">({deals.length})</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatCurrency(stageTotal)}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-2 min-h-[200px]">
                {deals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No deals</p>
                ) : (
                  deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} contactName={deal.contact_id ? contactMap.get(deal.contact_id) : undefined} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
