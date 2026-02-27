import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useGoals } from '../hooks/use-goals'
import { GoalCard } from '../components/goal-card'
import { CreateGoalDialog } from '../components/create-goal-dialog'
import { GoalDetailDrawer } from '../components/goal-detail-drawer'
import type { Goal } from '../hooks/use-goals'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'off_track', label: 'Off Track' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'dropped', label: 'Dropped' },
]

export default function GoalsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: goals = [], isLoading } = useGoals(workspaceId)

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all'
    ? goals
    : goals.filter((g) => g.status === statusFilter)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Goals</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Track your team's objectives and progress</p>
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
            New goal
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {!workspaceId ? (
          <EmptyState message="No workspace selected. Please select or create a workspace first." />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-md border border-border bg-neutral-50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={
              statusFilter !== 'all'
                ? `No goals with status "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}".`
                : "No goals yet. Create one to track your team's progress."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => setSelectedGoal(goal)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateGoalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
      />

      <GoalDetailDrawer
        goal={selectedGoal}
        workspaceId={workspaceId}
        onClose={() => setSelectedGoal(null)}
      />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Plus className="h-6 w-6 text-neutral-400" />
      </div>
      <p className="text-sm text-neutral-500 max-w-xs">{message}</p>
    </div>
  )
}
