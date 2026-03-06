import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ProjectHeader } from '../components/project-header'
import { ActivityTimeline } from '../components/activity-timeline'
import api from '@/shared/lib/api'

interface SectionStat { section_name: string; total: number; completed: number }
interface AssigneeStat { assignee_name: string; total: number; completed: number }
interface Stats {
  total_tasks: number; completed: number; incomplete: number; overdue: number
  by_section: SectionStat[]; by_assignee: AssigneeStat[]; by_priority: Record<string, number>
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-blue-100 text-blue-700',
  none: 'bg-muted text-muted-foreground',
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted animate-pulse h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted animate-pulse h-44" />
        <div className="rounded-lg border border-border bg-muted animate-pulse h-44" />
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const { t } = useTranslation('pms')
  const { projectId } = useParams<{ projectId: string }>()

  const PRIORITY_LABELS: Record<string, string> = {
    high: t('task.priority.high'), medium: t('task.priority.medium'),
    low: t('task.priority.low'), none: t('task.priority.none'),
  }

  const { data: stats, isLoading, isError } = useQuery<Stats>({
    queryKey: ['project-stats', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}/stats`).then((r) => r.data),
    enabled: !!projectId,
  })

  const completionPct = stats && stats.total_tasks > 0
    ? Math.round((stats.completed / stats.total_tasks) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader activeView="overview" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full pt-6 px-6 pb-12 space-y-6">
          {isLoading && <StatsSkeleton />}

          {isError && (
            <p className="text-sm text-red-500 text-center py-16">Failed to load project stats.</p>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label={t('task.title')} value={stats.total_tasks} />
                <StatCard label={t('task.status.completed')} value={stats.completed} sub={`${completionPct}%`} />
                <StatCard label={t('task.status.inProgress')} value={stats.incomplete} />
                <StatCard label={t('myTasks.overdue')} value={stats.overdue} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-background p-4 flex flex-col items-center justify-center gap-3">
                  <p className="text-xs font-medium text-muted-foreground self-start">Completion</p>
                  <div className="relative h-28 w-28">
                    <div
                      className="h-28 w-28 rounded-full"
                      style={{ background: `conic-gradient(var(--primary, #5E6AD2) ${completionPct}%, hsl(var(--muted)) 0)` }}
                    />
                    <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
                      <span className="text-lg font-semibold text-foreground">{completionPct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completed} of {stats.total_tasks} tasks complete
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">By section</p>
                  {stats.by_section.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No sections</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.by_section.map((s) => (
                        <div key={s.section_name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground truncate">{s.section_name}</span>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{s.completed}/{s.total}</span>
                          </div>
                          <ProgressBar value={s.completed} max={s.total} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">By priority</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['high', 'medium', 'low', 'none'].map((p) => (
                    <div key={p} className={`rounded-md px-3 py-2 ${PRIORITY_COLORS[p] ?? 'bg-muted'}`}>
                      <p className="text-xs font-medium">{PRIORITY_LABELS[p]}</p>
                      <p className="text-xl font-semibold mt-0.5">{stats.by_priority[p] ?? 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Recent activity</p>
                <ActivityTimeline projectId={projectId!} />
              </div>

              {stats.by_assignee.length > 0 && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Top contributors</p>
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
                            <span className="text-xs text-foreground truncate">{a.assignee_name}</span>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{a.completed}/{a.total}</span>
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
