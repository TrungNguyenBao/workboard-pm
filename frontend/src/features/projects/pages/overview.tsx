import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ProjectHeader } from '../components/project-header'
import { ActivityTimeline } from '../components/activity-timeline'
import api from '@/shared/lib/api'

interface SectionStat {
  section_name: string
  total: number
  completed: number
}

interface AssigneeStat {
  assignee_name: string
  total: number
  completed: number
}

interface Stats {
  total_tasks: number
  completed: number
  incomplete: number
  overdue: number
  by_section: SectionStat[]
  by_assignee: AssigneeStat[]
  by_priority: Record<string, number>
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-blue-100 text-blue-700',
  none: 'bg-neutral-100 text-neutral-500',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function OverviewPage() {
  const { projectId } = useParams<{ projectId: string }>()

  const { data: stats, isLoading, isError } = useQuery<Stats>({
    queryKey: ['project-stats', projectId],
    queryFn: () => api.get(`/projects/${projectId}/stats`).then((r) => r.data),
    enabled: !!projectId,
  })

  const completionPct =
    stats && stats.total_tasks > 0
      ? Math.round((stats.completed / stats.total_tasks) * 100)
      : 0

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader activeView="overview" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full pt-6 px-6 pb-12 space-y-6">
          {isLoading && (
            <p className="text-sm text-neutral-400 text-center py-16">Loading stats…</p>
          )}

          {isError && (
            <p className="text-sm text-red-500 text-center py-16">Failed to load project stats.</p>
          )}

          {stats && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total tasks" value={stats.total_tasks} />
                <StatCard label="Completed" value={stats.completed} sub={`${completionPct}%`} />
                <StatCard label="Incomplete" value={stats.incomplete} />
                <StatCard label="Overdue" value={stats.overdue} />
              </div>

              {/* Completion ring + section breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Completion ring */}
                <div className="rounded-lg border border-border bg-white p-4 flex flex-col items-center justify-center gap-3">
                  <p className="text-xs font-medium text-neutral-500 self-start">Completion</p>
                  <div className="relative h-28 w-28">
                    <div
                      className="h-28 w-28 rounded-full"
                      style={{
                        background: `conic-gradient(var(--primary, #5E6AD2) ${completionPct}%, #e5e7eb 0)`,
                      }}
                    />
                    {/* Inner white circle */}
                    <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                      <span className="text-lg font-semibold text-neutral-800">{completionPct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {stats.completed} of {stats.total_tasks} tasks complete
                  </p>
                </div>

                {/* Section breakdown */}
                <div className="rounded-lg border border-border bg-white p-4">
                  <p className="text-xs font-medium text-neutral-500 mb-3">By section</p>
                  {stats.by_section.length === 0 ? (
                    <p className="text-xs text-neutral-400">No sections</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.by_section.map((s) => (
                        <div key={s.section_name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-700 truncate">{s.section_name}</span>
                            <span className="text-xs text-neutral-400 ml-2 flex-shrink-0">
                              {s.completed}/{s.total}
                            </span>
                          </div>
                          <ProgressBar value={s.completed} max={s.total} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority grid */}
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-xs font-medium text-neutral-500 mb-3">By priority</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['high', 'medium', 'low', 'none'].map((p) => (
                    <div
                      key={p}
                      className={`rounded-md px-3 py-2 ${PRIORITY_COLORS[p] ?? 'bg-neutral-100'}`}
                    >
                      <p className="text-xs font-medium">{PRIORITY_LABELS[p]}</p>
                      <p className="text-xl font-semibold mt-0.5">{stats.by_priority[p] ?? 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-xs font-medium text-neutral-500 mb-3">Recent activity</p>
                <ActivityTimeline projectId={projectId!} />
              </div>

              {/* Assignee table */}
              {stats.by_assignee.length > 0 && (
                <div className="rounded-lg border border-border bg-white p-4">
                  <p className="text-xs font-medium text-neutral-500 mb-3">Top contributors</p>
                  <div className="space-y-3">
                    {stats.by_assignee.map((a) => (
                      <div key={a.assignee_name} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-medium text-primary">
                            {a.assignee_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-700 truncate">{a.assignee_name}</span>
                            <span className="text-xs text-neutral-400 ml-2 flex-shrink-0">
                              {a.completed}/{a.total}
                            </span>
                          </div>
                          <ProgressBar value={a.completed} max={a.total} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
