import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PipelineDealCard } from './pipeline-deal-card'
import { type Deal } from '../hooks/use-deals'

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value}`
}

interface Props {
  stageValue: string
  stageLabel: string
  color: string
  deals: Deal[]
  contactMap: Map<string, string>
}

export function PipelineStageColumn({ stageValue, stageLabel, color, deals, contactMap }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${stageValue}` })
  const dealIds = deals.map((d) => d.id)

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
  const weightedValue = deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)

  return (
    <div className="flex-shrink-0 w-64 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium truncate">{stageLabel}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">({deals.length})</span>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{formatCurrency(totalValue)}</span>
      </div>

      {/* Weighted value sub-header */}
      {weightedValue > 0 && (
        <div className="text-xs text-muted-foreground px-1 mb-1.5">
          Weighted: {formatCurrency(Math.round(weightedValue))}
        </div>
      )}

      {/* Droppable + sortable zone */}
      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 space-y-2 rounded-lg p-2 min-h-[200px] transition-colors ${
            isOver ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/30'
          }`}
        >
          {deals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No deals</p>
          ) : (
            deals.map((deal) => (
              <PipelineDealCard
                key={deal.id}
                deal={deal}
                contactName={deal.contact_id ? contactMap.get(deal.contact_id) : undefined}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
