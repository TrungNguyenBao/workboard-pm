import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useUpdateGoal, useDeleteGoal } from '../hooks/use-goals'
import { GoalLinkedItems } from './goal-linked-items'
import api from '@/shared/lib/api'
import type { Goal } from '../hooks/use-goals'

interface Member { id: string; user_id: string; user_name: string }

interface Props {
  goal: Goal | null
  workspaceId: string
  onClose: () => void
}

const PROGRESS_COLOR: Record<string, string> = {
  on_track: '#27AE60', at_risk: '#F2C94C', off_track: '#E36857',
  achieved: '#2F80ED', dropped: '#9CA3AF',
}

export function GoalDetailDrawer({ goal, workspaceId, onClose }: Props) {
  const { t } = useTranslation('pms')
  const updateGoal = useUpdateGoal(workspaceId)
  const deleteGoal = useDeleteGoal(workspaceId)

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId && !!goal,
  })

  function patch(data: Record<string, unknown>) {
    if (!goal) return
    updateGoal.mutate({ goalId: goal.id, ...data })
  }

  function handleDelete() {
    if (!goal) return
    if (window.confirm(t('common:common.deleteConfirmFull', { name: goal.title }))) {
      deleteGoal.mutate(goal.id)
      onClose()
    }
  }

  const progressColor = PROGRESS_COLOR[goal?.status ?? 'on_track']

  return (
    <Sheet open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col w-[480px] p-0 overflow-hidden">
        {goal && (
          <>
            <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: goal.color }} />
                <SheetTitle
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.textContent?.trim()
                    if (val && val !== goal.title) patch({ title: val })
                  }}
                  className="text-base font-semibold text-neutral-900 outline-none flex-1 cursor-text"
                >
                  {goal.title}
                </SheetTitle>
                <button
                  onClick={handleDelete}
                  className="mt-0.5 flex-shrink-0 text-neutral-300 hover:text-red-500 transition-colors"
                  title={t('common:common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {/* Meta fields */}
              <div className="px-6 py-4 space-y-3 border-b border-border">
                <MetaRow label={t('common:common.status')}>
                  <Select value={goal.status} onValueChange={(v) => patch({ status: v })}>
                    <SelectTrigger className="h-7 w-32 text-xs border-0 bg-neutral-100 hover:bg-neutral-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_track">{t('goal.status.onTrack')}</SelectItem>
                      <SelectItem value="at_risk">{t('goal.status.atRisk')}</SelectItem>
                      <SelectItem value="off_track">{t('goal.status.offTrack')}</SelectItem>
                      <SelectItem value="achieved">{t('goal.status.achieved')}</SelectItem>
                      <SelectItem value="dropped">{t('goal.status.dropped')}</SelectItem>
                    </SelectContent>
                  </Select>
                </MetaRow>

                <MetaRow label="Owner">
                  <Select value={goal.owner_id} onValueChange={(v) => patch({ owner_id: v })}>
                    <SelectTrigger className="h-7 w-36 text-xs border-0 bg-neutral-100 hover:bg-neutral-200">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.user_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MetaRow>

                <MetaRow label={t('task.dueDate')}>
                  <input
                    type="date"
                    defaultValue={goal.due_date ? goal.due_date.slice(0, 10) : ''}
                    onChange={(e) => patch({ due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="text-xs bg-neutral-100 rounded px-2 py-1 border-0 outline-none"
                  />
                </MetaRow>

                <MetaRow label="Tracking">
                  <div className="flex gap-3">
                    {(['manual', 'auto'] as const).map((m) => (
                      <label key={m} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`calc-${goal.id}`}
                          value={m}
                          checked={goal.calculation_method === m}
                          onChange={() => patch({ calculation_method: m })}
                        />
                        <span>{m === 'auto' ? 'Auto' : 'Manual'}</span>
                      </label>
                    ))}
                  </div>
                </MetaRow>

                <MetaRow label="Progress">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, goal.progress_value)}%`, backgroundColor: progressColor }}
                      />
                    </div>
                    {goal.calculation_method === 'manual' ? (
                      <input
                        type="number" min={0} max={100} step={1}
                        defaultValue={Math.round(goal.progress_value)}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value)
                          if (!isNaN(v)) patch({ progress_value: Math.min(100, Math.max(0, v)) })
                        }}
                        className="w-14 text-xs bg-neutral-100 rounded px-2 py-1 border-0 outline-none text-right"
                      />
                    ) : (
                      <span className="text-xs text-neutral-500 w-14 text-right">{Math.round(goal.progress_value)}%</span>
                    )}
                  </div>
                </MetaRow>
              </div>

              {/* Description */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-neutral-500 mb-2">{t('common:common.description')}</p>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => patch({ description: e.currentTarget.textContent?.trim() || null })}
                  className="text-sm text-neutral-700 outline-none min-h-[48px] cursor-text empty:before:content-['Add_description…'] empty:before:text-neutral-300"
                >
                  {goal.description}
                </div>
              </div>

              <GoalLinkedItems workspaceId={workspaceId} goalId={goal.id} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-neutral-500 flex-shrink-0">{label}</span>
      {children}
    </div>
  )
}
