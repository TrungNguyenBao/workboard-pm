import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import api from '@/shared/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

const COLORS = [
  '#5E6AD2', '#E36857', '#F2C94C', '#27AE60',
  '#2F80ED', '#F28C38', '#9B51E0', '#56CCF2',
]

export function CreateProjectDialog({ open, onOpenChange, workspaceId }: Props) {
  const { t } = useTranslation('pms')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post(`/pms/workspaces/${workspaceId}/projects`, {
        name: name.trim(),
        color,
      })
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] })
      toast({ title: t('project.created', { name: data.name }), variant: 'success' })
      setName('')
      setColor(COLORS[0])
      onOpenChange(false)
      navigate(`/pms/projects/${data.id}/board`)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ title: t('project.createFailed'), description: detail ?? 'Please try again', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('project.new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">{t('project.name')}</Label>
            <Input
              id="proj-name"
              placeholder={t('project.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('project.color')}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-6 w-6 rounded-full ring-offset-2 transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common:common.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? t('project.creating') : t('project.createProject')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
