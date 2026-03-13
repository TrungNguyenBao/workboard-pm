import { useState } from 'react'
import { X, Link2, ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  useTaskDependencies,
  useAddDependency,
  useRemoveDependency,
  type DependencyResponse,
} from '../hooks/use-task-dependencies'

interface Props {
  projectId: string
  taskId: string
}

export function DependencySelector({ projectId, taskId }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: deps = [] } = useTaskDependencies(projectId, taskId)
  const addDep = useAddDependency(projectId, taskId)
  const removeDep = useRemoveDependency(projectId, taskId)

  const blocking = deps.filter((d) => d.blocking_task_id !== taskId && d.blocked_task_id === taskId)
  const blockedBy = deps.filter((d) => d.blocking_task_id === taskId)

  async function handleAdd() {
    const val = input.trim()
    if (!val) return
    setError(null)
    try {
      await addDep.mutateAsync(val)
      setInput('')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null
      setError(msg ?? 'Failed to add dependency')
    }
  }

  return (
    <div className="space-y-3">
      {blocking.length > 0 && (
        <DepList
          label="Blocked by"
          deps={blocking}
          onRemove={(id) => removeDep.mutate(id)}
          showBlocking
        />
      )}
      {blockedBy.length > 0 && (
        <DepList
          label="Blocking"
          deps={blockedBy}
          onRemove={(id) => removeDep.mutate(id)}
          showBlocking={false}
        />
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Blocking task ID…"
          className="flex-1 text-xs bg-muted rounded px-2 py-1 border-0 outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleAdd}
          disabled={addDep.isPending || !input.trim()}
          className="text-xs text-primary hover:text-primary/80 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function DepList({
  label,
  deps,
  onRemove,
  showBlocking,
}: {
  label: string
  deps: DependencyResponse[]
  onRemove: (depId: string) => void
  showBlocking: boolean
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
      <div className="space-y-1">
        {deps.map((dep) => {
          const title = showBlocking ? dep.blocking_task_title : dep.blocked_task_title
          return (
            <div
              key={dep.id}
              className="flex items-center gap-1.5 text-xs group"
            >
              <Link2 className={cn('h-3 w-3 flex-shrink-0', showBlocking ? 'text-amber-500' : 'text-muted-foreground')} />
              {showBlocking && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              <span className="flex-1 truncate text-foreground">{title}</span>
              <button
                onClick={() => onRemove(dep.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
