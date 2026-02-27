import { useState } from 'react'
import { Link2, Plus, Target, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useGoalLinkedProjects, useGoalLinkedTasks, useUnlinkProject, useUnlinkTask } from '../hooks/use-goals'
import { LinkProjectsDialog } from './link-projects-dialog'
import { LinkTasksDialog } from './link-tasks-dialog'

interface Props {
  workspaceId: string
  goalId: string
}

export function GoalLinkedItems({ workspaceId, goalId }: Props) {
  const [linkProjOpen, setLinkProjOpen] = useState(false)
  const [linkTaskOpen, setLinkTaskOpen] = useState(false)

  const { data: linkedProjects = [] } = useGoalLinkedProjects(workspaceId, goalId)
  const { data: linkedTasks = [] } = useGoalLinkedTasks(workspaceId, goalId)
  const unlinkProject = useUnlinkProject(workspaceId, goalId)
  const unlinkTask = useUnlinkTask(workspaceId, goalId)

  return (
    <>
      {/* Linked Projects */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-neutral-500">
            <Link2 className="h-3.5 w-3.5 inline mr-1" />
            Linked Projects {linkedProjects.length > 0 && `(${linkedProjects.length})`}
          </p>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setLinkProjOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Link
          </Button>
        </div>
        {linkedProjects.length === 0 ? (
          <p className="text-xs text-neutral-400">No projects linked yet.</p>
        ) : (
          <div className="space-y-1">
            {linkedProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 group">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-neutral-700 flex-1 truncate">{p.name}</span>
                <button
                  onClick={() => unlinkProject.mutate(p.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Tasks */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-neutral-500">
            <Target className="h-3.5 w-3.5 inline mr-1" />
            Linked Tasks {linkedTasks.length > 0 && `(${linkedTasks.length})`}
          </p>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setLinkTaskOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Link
          </Button>
        </div>
        {linkedTasks.length === 0 ? (
          <p className="text-xs text-neutral-400">No tasks linked yet.</p>
        ) : (
          <div className="space-y-1">
            {linkedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 group">
                <span className={cn('h-2 w-2 rounded-full flex-shrink-0', t.status === 'completed' ? 'bg-green-500' : 'bg-neutral-300')} />
                <span className={cn('text-sm flex-1 truncate', t.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-700')}>
                  {t.title}
                </span>
                <button
                  onClick={() => unlinkTask.mutate(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <LinkProjectsDialog
        open={linkProjOpen}
        onOpenChange={setLinkProjOpen}
        workspaceId={workspaceId}
        goalId={goalId}
        linkedProjectIds={linkedProjects.map((p) => p.id)}
      />
      <LinkTasksDialog
        open={linkTaskOpen}
        onOpenChange={setLinkTaskOpen}
        workspaceId={workspaceId}
        goalId={goalId}
        linkedTaskIds={linkedTasks.map((t) => t.id)}
      />
    </>
  )
}
