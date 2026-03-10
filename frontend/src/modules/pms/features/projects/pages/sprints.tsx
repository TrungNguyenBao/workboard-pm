import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { ProjectHeader } from '../components/project-header'
import { SprintCard } from '../components/sprint-card'
import { SprintAnalyticsPanel } from '../components/sprint-analytics-panel'
import { SprintCompleteDialog } from '../components/sprint-complete-dialog'
import { useSprints } from '../hooks/use-sprints'

export default function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: sprints = [], isLoading } = useSprints(projectId!)
  const [completeSprintId, setCompleteSprintId] = useState<string | null>(null)

  const activeSprint = sprints.find((s) => s.status === 'active')
  const completedSprints = sprints
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  const hasAnySprints = sprints.length > 0

  return (
    <>
      <div className="flex flex-col h-full">
        <ProjectHeader activeView="sprints" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
          )}

          {!isLoading && !hasAnySprints && (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
              <Layers className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No sprints yet</p>
              <p className="text-xs opacity-70">Create a sprint from the Backlog view to get started.</p>
            </div>
          )}

          {/* Active sprint card */}
          {activeSprint && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Active Sprint
              </h2>
              <SprintCard
                sprint={activeSprint}
                variant="active"
                onComplete={(id) => setCompleteSprintId(id)}
              />
            </section>
          )}

          {/* Analytics */}
          {hasAnySprints && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Sprint Analytics
              </h2>
              <div className="border border-border rounded-lg p-4">
                <SprintAnalyticsPanel projectId={projectId!} />
              </div>
            </section>
          )}

          {/* Sprint history */}
          {completedSprints.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Sprint History
              </h2>
              <div className="space-y-2">
                {completedSprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} variant="history" />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {completeSprintId && (
        <SprintCompleteDialog
          projectId={projectId!}
          sprintId={completeSprintId}
          open={true}
          onOpenChange={(open) => !open && setCompleteSprintId(null)}
        />
      )}
    </>
  )
}
