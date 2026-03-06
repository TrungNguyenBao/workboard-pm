import { AlertCircle, CheckSquare, FolderKanban, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { usePmsStats } from '../hooks/use-pms-stats'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#38BDF8',
  none: '#A1A1AA',
}

function buildPriorityData(tasks: Task[]) {
  const counts: Record<string, number> = { high: 0, medium: 0, low: 0, none: 0 }
  for (const t of tasks) {
    const p = (t.priority ?? 'none').toLowerCase()
    if (p in counts) counts[p]++
    else counts.none++
  }
  return [
    { name: 'High', count: counts.high, fill: PRIORITY_COLORS.high },
    { name: 'Medium', count: counts.medium, fill: PRIORITY_COLORS.medium },
    { name: 'Low', count: counts.low, fill: PRIORITY_COLORS.low },
    { name: 'None', count: counts.none, fill: PRIORITY_COLORS.none },
  ]
}

export default function PmsDashboardPage() {
  const { stats, tasks, isLoading } = usePmsStats()
  const priorityData = buildPriorityData(tasks)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks" value={stats.totalTasks} icon={<CheckSquare className="h-5 w-5" />} />
        <KpiCard
          label="Overdue"
          value={stats.overdueTasks}
          icon={<AlertCircle className="h-5 w-5" />}
          valueClassName={stats.overdueTasks > 0 ? 'text-red-500' : undefined}
        />
        <KpiCard label="Completed This Week" value={stats.completedThisWeek} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Projects" value={stats.totalProjects} icon={<FolderKanban className="h-5 w-5" />} />
      </div>

      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium text-foreground mb-4">Tasks by Priority</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priorityData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {priorityData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
