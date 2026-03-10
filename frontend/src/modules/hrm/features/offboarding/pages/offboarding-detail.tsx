import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import {
  useResignations,
  useHandoverTasks,
  useUpdateHandoverTask,
  useExitInterview,
  useCreateExitInterview,
} from '../hooks/use-offboarding'
import { HandoverTaskFormDialog } from '../components/handover-task-form-dialog'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  completed: 'bg-muted text-muted-foreground',
  in_progress: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
}

export default function OffboardingDetailPage() {
  const { resignationId } = useParams<{ resignationId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  const { data: resignationsData } = useResignations(workspaceId, { page_size: 200 })
  const resignation = resignationsData?.items.find((r) => r.id === resignationId)

  const { data: tasksData } = useHandoverTasks(workspaceId, {
    resignation_id: resignationId,
    page_size: 100,
  })
  const { data: exitInterview } = useExitInterview(workspaceId, resignationId ?? '')
  const { data: empData } = useEmployees(workspaceId, { page_size: 200 })

  const updateTask = useUpdateHandoverTask(workspaceId)
  const createExitInterview = useCreateExitInterview(workspaceId)

  const empMap = new Map((empData?.items ?? []).map((e) => [e.id, e.name]))

  if (!resignation) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button onClick={() => navigate('/hrm/offboarding')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">
            {empMap.get(resignation.employee_id) ?? 'Unknown Employee'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Resigned: {resignation.resignation_date} · Last day: {resignation.last_working_day}
          </p>
        </div>
        <Badge variant="outline" className={STATUS_COLORS[resignation.status] ?? ''}>
          {resignation.status}
        </Badge>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Reason */}
        {resignation.reason && (
          <div>
            <h2 className="text-sm font-medium mb-1">Reason</h2>
            <p className="text-sm text-muted-foreground">{resignation.reason}</p>
          </div>
        )}

        {/* Handover Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Handover Tasks</h2>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setTaskDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Task
            </Button>
          </div>
          {(tasksData?.items ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No handover tasks yet</p>
          ) : (
            <div className="space-y-2">
              {(tasksData?.items ?? []).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-md border border-border text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.task_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.to_employee_id ? `To: ${empMap.get(task.to_employee_id) ?? task.to_employee_id.slice(0, 8)}` : 'Unassigned'}
                      {task.due_date ? ` · Due: ${task.due_date}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[task.status] ?? ''}`}>
                      {task.status}
                    </Badge>
                    {task.status !== 'completed' && (
                      <button
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Mark complete"
                        onClick={async () => {
                          await updateTask.mutateAsync({ taskId: task.id, status: 'completed' })
                          toast({ title: 'Task completed', variant: 'success' })
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exit Interview */}
        <div>
          <h2 className="text-sm font-medium mb-3">Exit Interview</h2>
          {exitInterview ? (
            <div className="p-4 rounded-md border border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Interviewer: {exitInterview.interviewer_id ? (empMap.get(exitInterview.interviewer_id) ?? 'Unknown') : 'Not set'}
                </p>
                {exitInterview.conducted_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(exitInterview.conducted_at).toLocaleString()}
                  </p>
                )}
              </div>
              {exitInterview.feedback && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {Object.entries(exitInterview.feedback).map(([k, v]) => (
                    <p key={k}><span className="font-medium capitalize">{k.replace(/_/g, ' ')}</span>: {String(v)}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">No exit interview scheduled</p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={async () => {
                  await createExitInterview.mutateAsync({ resignation_id: resignationId })
                  toast({ title: 'Exit interview created', variant: 'success' })
                }}
                disabled={createExitInterview.isPending}
              >
                Create
              </Button>
            </div>
          )}
        </div>
      </div>

      <HandoverTaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        workspaceId={workspaceId}
        resignationId={resignationId ?? ''}
        fromEmployeeId={resignation.employee_id}
      />
    </div>
  )
}
