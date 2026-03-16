import { AlertCircle, CheckSquare, TrendingUp, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE } from '@/shared/lib/chart-colors'
import { usePmsStats } from '../hooks/use-pms-stats'
import type { DashboardByProject } from '../hooks/use-pms-stats'

const PRIORITY_COLORS: Record<string, string> = {
  high: CHART_COLORS.priorityHigh,
  medium: CHART_COLORS.priorityMedium,
  low: CHART_COLORS.priorityLow,
  none: CHART_COLORS.priorityNone,
}

function buildPriorityData(by_priority: { high: number; medium: number; low: number; none: number }) {
  return [
    { name: 'High', count: by_priority.high, fill: PRIORITY_COLORS.high },
    { name: 'Medium', count: by_priority.medium, fill: PRIORITY_COLORS.medium },
    { name: 'Low', count: by_priority.low, fill: PRIORITY_COLORS.low },
    { name: 'None', count: by_priority.none, fill: PRIORITY_COLORS.none },
  ]
}

function ProjectDistributionRow({ project }: { project: DashboardByProject }) {
  const pct = project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: project.project_color }}
          />
          <span className="truncate text-foreground">{project.project_name}</span>
        </div>
        <span className="text-muted-foreground shrink-0 ml-2">
          {project.completed}/{project.total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: project.project_color }}
        />
      </div>
    </div>
  )
}

export default function PmsDashboardPage() {
  const { stats, isLoading } = usePmsStats()
  const priorityData = buildPriorityData(stats.by_priority)

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks" value={stats.total_tasks} icon={<CheckSquare className="h-5 w-5" />} />
        <KpiCard
          label="Overdue"
          value={stats.overdue_tasks}
          icon={<AlertCircle className="h-5 w-5" />}
          valueClassName={stats.overdue_tasks > 0 ? 'text-red-500' : undefined}
        />
        <KpiCard
          label="Completed This Week"
          value={stats.tasks_completed_this_week}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          label="Active Sprints"
          value={stats.active_sprints}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium text-foreground mb-4">Tasks by Priority</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priorityData} barSize={36}>
            <CartesianGrid {...CHART_GRID_STYLE} />
            <XAxis dataKey="name" tick={CHART_AXIS_STYLE} />
            <YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {priorityData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {stats.by_project.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Tasks by Project</p>
            <span className="text-xs text-muted-foreground">{stats.by_project.length} projects</span>
          </div>
          <div className="space-y-3">
            {stats.by_project.map((project) => (
              <ProjectDistributionRow key={project.project_name} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
