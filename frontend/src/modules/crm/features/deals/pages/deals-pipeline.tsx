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

interface PipelineFilters {
  ownerFilter: 'all' | 'me'
  valueMin: string
  valueMax: string
  closeDateFrom: string
  closeDateTo: string
}

export default function DealsPipelinePage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const currentUser = useAuthStore((s) => s.user)

  const [filters, setFilters] = useState<PipelineFilters>({
    ownerFilter: 'all',
    valueMin: '',
    valueMax: '',
    closeDateFrom: '',
    closeDateTo: '',
  })
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
    let all = dealsData?.items ?? []

    if (filters.ownerFilter === 'me' && currentUser) {
      all = all.filter((d) => d.owner_id === currentUser.id)
    }
    if (filters.valueMin !== '') {
      const min = parseFloat(filters.valueMin)
      if (!isNaN(min)) all = all.filter((d) => d.value >= min)
    }
    if (filters.valueMax !== '') {
      const max = parseFloat(filters.valueMax)
      if (!isNaN(max)) all = all.filter((d) => d.value <= max)
    }
    if (filters.closeDateFrom) {
      all = all.filter(
        (d) => d.expected_close_date && d.expected_close_date >= filters.closeDateFrom
      )
    }
    if (filters.closeDateTo) {
      all = all.filter(
        (d) => d.expected_close_date && d.expected_close_date <= filters.closeDateTo
      )
    }

    return all
  }, [dealsData, filters, currentUser])

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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-foreground mr-2">Pipeline</h2>

        {/* Owner filter */}
        <select
          value={filters.ownerFilter}
          onChange={(e) =>
            setFilters((f) => ({ ...f, ownerFilter: e.target.value as 'all' | 'me' }))
          }
          className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Deals</option>
          <option value="me">My Deals</option>
        </select>

        {/* Value min/max */}
        <input
          type="number"
          placeholder="Min value"
          value={filters.valueMin}
          onChange={(e) => setFilters((f) => ({ ...f, valueMin: e.target.value }))}
          className="w-28 text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Max value"
          value={filters.valueMax}
          onChange={(e) => setFilters((f) => ({ ...f, valueMax: e.target.value }))}
          className="w-28 text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Close date range */}
        <input
          type="date"
          value={filters.closeDateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, closeDateFrom: e.target.value }))}
          className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          title="Close date from"
        />
        <input
          type="date"
          value={filters.closeDateTo}
          onChange={(e) => setFilters((f) => ({ ...f, closeDateTo: e.target.value }))}
          className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          title="Close date to"
        />

        {/* Reset */}
        {(filters.ownerFilter !== 'all' ||
          filters.valueMin ||
          filters.valueMax ||
          filters.closeDateFrom ||
          filters.closeDateTo) && (
          <button
            onClick={() =>
              setFilters({
                ownerFilter: 'all',
                valueMin: '',
                valueMax: '',
                closeDateFrom: '',
                closeDateTo: '',
              })
            }
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
        </span>
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
              contactName={
                activeDeal.contact_id ? contactMap.get(activeDeal.contact_id) : undefined
              }
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
