import { useEffect, useState } from 'react'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { cn } from '@/shared/lib/utils'
import { CreateWorkspaceDialog } from '@/features/workspaces/components/create-workspace-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import api from '@/shared/lib/api'

interface Workspace { id: string; name: string; slug: string }

interface Props { collapsed: boolean }

export function SidebarWorkspacePicker({ collapsed }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameInput, setRenameInput] = useState('')
  const [wsDialogOpen, setWsDialogOpen] = useState(false)

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then((r) => r.data),
  })

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id)
      qc.invalidateQueries({ queryKey: ['projects'] })
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace, qc])

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId)
  const initial = activeWs ? activeWs.name[0].toUpperCase() : 'W'

  async function commitRename() {
    if (renameInput.trim() && activeWorkspaceId) {
      await api.patch(`/workspaces/${activeWorkspaceId}`, { name: renameInput.trim() })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    }
    setRenaming(false)
  }

  const trigger = (
    <button
      className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-accent transition-colors"
      onClick={() => setPickerOpen((v) => !v)}
    >
      <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initial}
      </div>
      {!collapsed && (
        <>
          <span className="text-sm font-semibold text-foreground truncate flex-1 text-left">
            {activeWs?.name ?? t('sidebar.noWorkspace')}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </>
      )}
    </button>
  )

  return (
    <div className="relative">
      {collapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">{activeWs?.name ?? t('sidebar.noWorkspace')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : trigger}

      {pickerOpen && !collapsed && (
        <div className="absolute left-0 right-0 top-full z-50 bg-background border border-border rounded-b-md shadow-lg">
          {workspaces.map((ws) => (
            <div key={ws.id} className="flex items-center group">
              <button
                className={cn(
                  'flex flex-1 items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                  ws.id === activeWorkspaceId && 'text-primary font-medium',
                )}
                onClick={() => {
                  setActiveWorkspace(ws.id)
                  qc.invalidateQueries({ queryKey: ['projects'] })
                  setPickerOpen(false)
                }}
              >
                <div className="h-5 w-5 rounded bg-primary/80 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {ws.name[0].toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </button>
              {ws.id === activeWorkspaceId && (
                <button
                  className="pr-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                  title={t('sidebar.renameWorkspace')}
                  onClick={() => { setRenameInput(ws.name); setRenaming(true); setPickerOpen(false) }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted border-t border-border transition-colors"
            onClick={() => { setPickerOpen(false); setWsDialogOpen(true) }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('sidebar.newWorkspace')}
          </button>
        </div>
      )}

      {renaming && !collapsed && (
        <div className="absolute left-0 right-0 top-full z-50 bg-background border border-border rounded-b-md shadow-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('sidebar.renameWorkspace')}</p>
          <input
            autoFocus
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setRenaming(false)
            }}
            className="w-full rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/40 mb-2 bg-background"
          />
          <div className="flex gap-2 justify-end">
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setRenaming(false)}>{t('common.cancel')}</button>
            <button className="text-xs text-primary hover:text-primary/80 font-medium" onClick={commitRename}>{t('common.save')}</button>
          </div>
        </div>
      )}

      <CreateWorkspaceDialog open={wsDialogOpen} onOpenChange={setWsDialogOpen} />
    </div>
  )
}
