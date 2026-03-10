import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useCreateGoal } from '../hooks/use-goals'
import api from '@/shared/lib/api'

interface Member { id: string; user_id: string; user_name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

const COLORS = ['#2563EB', '#E36857', '#F2C94C', '#27AE60', '#2F80ED', '#F28C38', '#9B51E0', '#56CCF2']

export function CreateGoalDialog({ open, onOpenChange, workspaceId }: Props) {
  const { t } = useTranslation('pms')
  const createGoal = useCreateGoal(workspaceId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [dueDate, setDueDate] = useState('')
  const [calcMethod, setCalcMethod] = useState<'manual' | 'auto'>('manual')
  const [status, setStatus] = useState('on_track')

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: open && !!workspaceId,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !ownerId) return
    try {
      await createGoal.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        owner_id: ownerId,
        color,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        calculation_method: calcMethod,
        status,
      })
      toast({ title: t('goal.new'), variant: 'success' })
      setTitle(''); setDescription(''); setOwnerId(''); setDueDate('')
      setColor(COLORS[0]); setCalcMethod('manual'); setStatus('on_track')
      onOpenChange(false)
    } catch {
      toast({ title: t('project.createFailed'), variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('goal.new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">{t('task.title')} *</Label>
            <Input id="goal-title" placeholder="Q1 revenue target" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">{t('common:common.description')}</Label>
            <textarea
              id="goal-desc"
              rows={2}
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner *</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_track">{t('goal.status.onTrack')}</SelectItem>
                  <SelectItem value="at_risk">{t('goal.status.atRisk')}</SelectItem>
                  <SelectItem value="off_track">{t('goal.status.offTrack')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t('project.color')}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full transition-all"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-due">Due date</Label>
              <input id="goal-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Progress tracking</Label>
              <div className="flex gap-3 pt-2">
                {(['manual', 'auto'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="calc" value={m} checked={calcMethod === m} onChange={() => setCalcMethod(m)} />
                    <span className="capitalize">{m === 'auto' ? 'Auto' : 'Manual'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
            <Button type="submit" disabled={createGoal.isPending || !title.trim() || !ownerId}>
              {createGoal.isPending ? t('project.creating') : t('goal.new')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
