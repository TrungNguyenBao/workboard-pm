import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useGoals } from '../hooks/use-goals'
import { GoalCard } from '../components/goal-card'
import { CreateGoalDialog } from '../components/create-goal-dialog'
import { GoalDetailDrawer } from '../components/goal-detail-drawer'
import type { Goal } from '../hooks/use-goals'

export default function GoalsListPage() {
  const { t } = useTranslation('pms')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: goals = [], isLoading } = useGoals(workspaceId)

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const STATUS_OPTIONS = [
    { value: 'all', label: t('goal.status.allStatuses') },
    { value: 'on_track', label: t('goal.status.onTrack') },
    { value: 'at_risk', label: t('goal.status.atRisk') },
    { value: 'off_track', label: t('goal.status.offTrack') },
    { value: 'achieved', label: t('goal.status.achieved') },
    { value: 'dropped', label: t('goal.status.dropped') },
  ]

  const filtered = statusFilter === 'all'
    ? goals
    : goals.filter((g) => g.status === statusFilter)

  const emptyMessage = statusFilter !== 'all'
    ? t('goal.noGoalsFiltered', { status: STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label })
    : t('goal.noGoals')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('goal.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('goal.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('goal.new')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {!workspaceId ? (
          <EmptyState icon={<Target className="h-10 w-10" />} title={t('goal.noWorkspace')} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-md border border-border bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Target className="h-10 w-10" />}
            title={emptyMessage}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedGoal(goal)} />
            ))}
          </div>
        )}
      </div>

      <CreateGoalDialog open={createOpen} onOpenChange={setCreateOpen} workspaceId={workspaceId} />
      <GoalDetailDrawer goal={selectedGoal} workspaceId={workspaceId} onClose={() => setSelectedGoal(null)} />
    </div>
  )
}
