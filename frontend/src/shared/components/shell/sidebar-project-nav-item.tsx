import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MoreHorizontal, Pencil, Settings, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { ProjectSettingsDialog } from '@/modules/pms/features/projects/components/project-settings-dialog'
import api from '@/shared/lib/api'

interface Project { id: string; name: string; color: string; description: string | null; is_archived: boolean }

interface Props {
  project: Project
  active: boolean
  workspaceId: string
  collapsed: boolean
}

export function SidebarProjectNavItem({ project, active, workspaceId, collapsed }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(project.name)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const rename = useMutation({
    mutationFn: (name: string) => api.patch(`/pms/projects/${project.id}`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', workspaceId] }),
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/pms/projects/${project.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] })
      navigate('/pms/my-tasks')
    },
  })

  function commitRename() {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== project.name) rename.mutate(trimmed)
    setRenaming(false)
  }

  if (renaming) {
    return (
      <div className="px-2 py-1">
        <input
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') { setRenaming(false); setNameInput(project.name) }
          }}
          className="w-full text-sm rounded border border-primary px-2 py-0.5 outline-none bg-background"
        />
      </div>
    )
  }

  const dot = <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={`/pms/projects/${project.id}/board`}
              className={cn(
                'flex items-center justify-center rounded-sm px-2 py-1.5 transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {dot}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{project.name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      <div className="group flex items-center gap-1">
        <Link
          to={`/pms/projects/${project.id}/board`}
          className={cn(
            'flex flex-1 min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
            active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {dot}
          <span className="truncate">{project.name}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground rounded transition-opacity">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setNameInput(project.name); setRenaming(true) }}>
              <Pencil className="h-3.5 w-3.5 mr-2" />{t('common.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="h-3.5 w-3.5 mr-2" />{t('common.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => { if (window.confirm(t('common.deleteConfirmFull', { name: project.name }))) remove.mutate() }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />{t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProjectSettingsDialog project={project} workspaceId={workspaceId} open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
