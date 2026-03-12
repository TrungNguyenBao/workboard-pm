import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_COLORS } from '@/shared/lib/chart-colors'
import api from '@/shared/lib/api'

interface VelocityEntry {
  stage: string
  avg_days: number
}

interface DealVelocityData {
  avg_days_total: number
  by_stage: VelocityEntry[]
}

function useDealVelocity(workspaceId: string) {
  return useQuery<DealVelocityData>({
    queryKey: ['crm-deal-velocity', workspaceId],
    queryFn: () =>
      api.get(`/crm/workspaces/${workspaceId}/analytics/velocity`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

function stageLabel(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DealVelocityChart() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data, isLoading } = useDealVelocity(wsId)

  const bars = (data?.by_stage ?? []).map((e) => ({
    name: stageLabel(e.stage),
    avg_days: e.avg_days,
  }))
  const maxDays = bars.length > 0 ? Math.max(...bars.map((b) => b.avg_days)) : 0

  if (isLoading) {
    return <div className="border border-border rounded-lg p-4 bg-card h-56 animate-pulse" />
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-sm font-medium text-foreground">Deal Velocity by Stage</p>
        {data && data.avg_days_total > 0 && (
          <span className="text-xs text-muted-foreground">
            avg {data.avg_days_total}d to close
          </span>
        )}
      </div>

      {bars.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No closed deals yet
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bars} barSize={32}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="name" tick={{ ...CHART_AXIS_STYLE, fontSize: 10 }} />
              <YAxis tick={CHART_AXIS_STYLE} unit="d" allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} days`, 'Avg time']} />
              <Bar dataKey="avg_days" radius={[4, 4, 0, 0]}>
                {bars.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.avg_days === maxDays ? CHART_COLORS.danger : CHART_COLORS.primary}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {maxDays > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              <span className="text-red-500 font-medium">Red bar</span> = bottleneck stage
            </p>
          )}
        </>
      )}
    </div>
  )
}
