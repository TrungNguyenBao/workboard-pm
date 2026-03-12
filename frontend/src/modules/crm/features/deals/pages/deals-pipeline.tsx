import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'
import { DEAL_STAGES, STAGE_PROBABILITY, useDeals, useUpdateDealStage, type Deal } from '../hooks/use-deals'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { PipelineDealCard } from '../components/pipeline-deal-card'
import { PipelineStageColumn } from '../components/pipeline-stage-column'

const STAGE_COLORS: Record<string, string> = {
  lead: '#94A3B8',
  qualified: '#38BDF8',
  needs_analysis: '#2563EB',
  proposal: '#1D4ED8',
  negotiation: '#F59E0B',
  closed_won: '#22C55E',
  closed_lost: '#EF4444',
}

export default function DealsPipelinePage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const currentUser = useAuthStore((s) => s.user)

  const [ownerFilter, setOwnerFilter] = useState<'all' | 'me'>('all')
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)

  const { data: dealsData, isLoading } = useDeals(workspaceId, { page_size: 200 })
  const { data: contactsData } = useContacts(workspaceId, { page_size: 200 })
  const updateStage = useUpdateDealStage(workspaceId)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const contactMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of contactsData?.items ?? []) map.set(c.id, c.name)
    return map
  }, [contactsData])

  const filteredDeals = useMemo(() => {
    const all = dealsData?.items ?? []
    if (ownerFilter === 'me' && currentUser) {
      return all.filter((d) => d.owner_id === currentUser.id)
    }
    return all
  }, [dealsData, ownerFilter, currentUser])

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {}
    for (const stage of DEAL_STAGES) grouped[stage.value] = []
    for (const deal of filteredDeals) {
      if (grouped[deal.stage]) grouped[deal.stage].push(deal)
      else if (grouped['lead']) grouped['lead'].push(deal)
    }
    return grouped
  }, [filteredDeals])

  function handleDragStart(e: DragStartEvent) {
    const deal = filteredDeals.find((d) => d.id === e.active.id)
    if (deal) setActiveDeal(deal)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = e
    if (!over) return

    const draggedDeal = filteredDeals.find((d) => d.id === active.id)
    if (!draggedDeal) return

    const overId = String(over.id)
    let targetStage: string

    if (overId.startsWith('column-')) {
      targetStage = overId.replace('column-', '')
    } else {
      const overDeal = filteredDeals.find((d) => d.id === overId)
      targetStage = overDeal?.stage ?? draggedDeal.stage
    }

    if (targetStage === draggedDeal.stage) return

    const probability = STAGE_PROBABILITY[targetStage] ?? draggedDeal.probability
    updateStage.mutate({ dealId: draggedDeal.id, stage: targetStage, probability })
  }

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
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Pipeline</h2>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value as 'all' | 'me')}
          className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Deals</option>
          <option value="me">My Deals</option>
        </select>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {DEAL_STAGES.map((stage) => (
            <PipelineStageColumn
              key={stage.value}
              stageValue={stage.value}
              stageLabel={stage.label}
              color={STAGE_COLORS[stage.value] ?? '#94A3B8'}
              deals={dealsByStage[stage.value] ?? []}
              contactMap={contactMap}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal && (
            <PipelineDealCard
              deal={activeDeal}
              contactName={activeDeal.contact_id ? contactMap.get(activeDeal.contact_id) : undefined}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
