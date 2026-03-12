import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArchiveRestore, Archive } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { FieldConfigPanel } from '@/modules/pms/features/custom-fields/components/field-config-panel'
import { MemberManagementPanel } from './member-management-panel'
import api from '@/shared/lib/api'

const COLORS = [
  '#2563EB', '#E36857', '#F2C94C', '#27AE60',
  '#2F80ED', '#F28C38', '#9B51E0', '#56CCF2',
  '#EC4899', '#14B8A6', '#64748B', '#EF4444',
]

interface Project {
  id: string
  name: string
  color: string
  description: string | null
  is_archived: boolean
}

interface Props {
  project: Project | null
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSettingsDialog({ project, workspaceId, open, onOpenChange }: Props) {
  const { t } = useTranslation('pms')
  const qc = useQueryClient()
  const [color, setColor] = useState(project?.color ?? COLORS[0])
  const [description, setDescription] = useState(project?.description ?? '')
  const [isArchived, setIsArchived] = useState(project?.is_archived ?? false)
  const [loading, setLoading] = useState(false)
  const [archiveLoading, setArchiveLoading] = useState(false)

  useEffect(() => {
    if (project) {
      setColor(project.color)
      setDescription(project.description ?? '')
      setIsArchived(project.is_archived)
    }
  }, [project])

  async function handleSave() {
    if (!project) return
    setLoading(true)
    try {
      await api.patch(`/pms/projects/${project.id}`, {
        color,
        description: description || null,
        is_archived: isArchived,
      })
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] })
      toast({ title: t('common:settings.saved'), variant: 'success' })
      onOpenChange(false)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ title: t('common:settings.saveFailed'), description: detail ?? 'Please try again', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleArchiveToggle(archive: boolean) {
    if (!project) return
    const msg = archive
      ? `Archive "${project.name}"? It will be hidden from the sidebar.`
      : `Restore "${project.name}"? It will become active again.`
    if (!window.confirm(msg)) return
    setArchiveLoading(true)
    try {
      await api.patch(`/pms/projects/${project.id}`, { is_archived: archive })
      setIsArchived(archive)
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] })
      toast({
        title: archive ? 'Project archived' : 'Project restored',
        variant: 'success',
      })
      onOpenChange(false)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ title: 'Action failed', description: detail ?? 'Please try again', variant: 'error' })
    } finally {
      setArchiveLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('common:settings.title')} — {project?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>{t('project.color')}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-6 w-6 rounded-full transition-all hover:scale-110"
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
            <div className="flex items-center gap-2 mt-1">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-neutral-500 font-mono">{color}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">{t('common:common.description')}</Label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase mb-2">{t('customField.title')}</p>
            {project && <FieldConfigPanel projectId={project.id} />}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase mb-2">Members</p>
            {project && <MemberManagementPanel projectId={project.id} />}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase mb-2">Danger zone</p>
            {isArchived ? (
              <div className="flex items-center justify-between gap-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">This project is archived.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={archiveLoading}
                  onClick={() => handleArchiveToggle(false)}
                  className="flex items-center gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/40"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Archive this project to hide it from the sidebar.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={archiveLoading}
                  onClick={() => handleArchiveToggle(true)}
                  className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-red-600 hover:border-red-300 dark:text-neutral-400"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common:common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('common:settings.saving') : t('common:common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
