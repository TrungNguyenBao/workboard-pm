import { CheckSquare, Square, Trash2 } from 'lucide-react'
import { toast } from '@/shared/components/ui/toast'
import { type OnboardingChecklist, useToggleOnboardingCompletion, useDeleteOnboardingChecklist } from '../hooks/use-onboarding'

interface Props {
  item: OnboardingChecklist
  workspaceId: string
}

export function OnboardingChecklistItem({ item, workspaceId }: Props) {
  const toggle = useToggleOnboardingCompletion(workspaceId)
  const remove = useDeleteOnboardingChecklist(workspaceId)

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-md group hover:bg-accent/50 transition-colors ${item.is_completed ? 'opacity-60' : ''}`}>
      <button
        className="flex-shrink-0 text-primary hover:text-primary/70 transition-colors"
        onClick={async () => {
          await toggle.mutateAsync(item.id)
        }}
        disabled={toggle.isPending}
        title={item.is_completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.is_completed
          ? <CheckSquare className="h-4 w-4" />
          : <Square className="h-4 w-4 text-muted-foreground" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
          {item.task_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.category && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {item.category}
            </span>
          )}
          {item.due_date && (
            <span className="text-xs text-muted-foreground">Due {item.due_date}</span>
          )}
        </div>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-600 transition-all"
        onClick={async () => {
          if (window.confirm('Delete this checklist item?')) {
            await remove.mutateAsync(item.id)
            toast({ title: 'Item deleted', variant: 'success' })
          }
        }}
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
