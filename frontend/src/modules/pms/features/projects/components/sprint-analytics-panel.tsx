import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import api from '@/shared/lib/api'
import { useBurndownData, useVelocityData } from '../hooks/use-sprint-analytics'
import { BurndownChart } from './burndown-chart'
import { VelocityChart } from './velocity-chart'

interface Sprint {
  id: string
  name: string
  status: string
  total_points: number
  completed_points: number
  task_count: number
}

interface Props {
  projectId: string
}

function useSprints(projectId: string) {
  return useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/sprints`).then((r) => r.data),
    enabled: !!projectId,
  })
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-md border border-border p-3 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  )
}

export function SprintAnalyticsPanel({ projectId }: Props) {
  const { data: sprints = [] } = useSprints(projectId)

  const activeSprints = sprints.filter(
    (s) => s.status === 'active' || s.status === 'completed',
  )

  const defaultSprintId =
    sprints.find((s) => s.status === 'active')?.id ?? activeSprints[0]?.id ?? null

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)

  // Use defaultSprintId on first render, selectedSprintId after user picks
  const effectiveSprintId = selectedSprintId ?? defaultSprintId

  const { data: burndownData = [] } = useBurndownData(projectId, effectiveSprintId)
  const { data: velocityData = [] } = useVelocityData(projectId)

  const selectedSprint = sprints.find((s) => s.id === effectiveSprintId)

  return (
    <div className="space-y-6">
      {/* Burndown section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Sprint Burndown</h3>
          {activeSprints.length > 0 && (
            <Select
              value={effectiveSprintId ?? ''}
              onValueChange={(v) => setSelectedSprintId(v)}
            >
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {activeSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedSprint && (
          <div className="flex gap-3 mb-4">
            <StatCard label="Total Points" value={selectedSprint.total_points} />
            <StatCard label="Completed" value={selectedSprint.completed_points} />
            <StatCard
              label="Remaining"
              value={selectedSprint.total_points - selectedSprint.completed_points}
            />
            <StatCard label="Tasks" value={selectedSprint.task_count} />
          </div>
        )}

        <BurndownChart data={burndownData} />
      </div>

      {/* Velocity section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Team Velocity</h3>
        <VelocityChart data={velocityData} />
      </div>
    </div>
  )
}
