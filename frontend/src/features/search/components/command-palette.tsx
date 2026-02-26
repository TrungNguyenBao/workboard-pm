import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, CheckSquare, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Project { id: string; name: string; color: string }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [query, setQuery] = useState('')

  // Global keyboard shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => api.get(`/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  function select(cb: () => void) {
    onOpenChange(false)
    setQuery('')
    cb()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command className="rounded-lg" shouldFilter={true}>
          <div className="flex items-center border-b border-border px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search tasks, projects…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty className="py-6 text-center text-sm text-neutral-400">
              No results found
            </Command.Empty>

            {projects.length > 0 && (
              <Command.Group heading="Projects">
                {projects
                  .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
                  .map((p) => (
                    <Command.Item
                      key={p.id}
                      value={p.name}
                      onSelect={() => select(() => navigate(`/projects/${p.id}/board`))}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xs text-sm text-neutral-700 cursor-pointer aria-selected:bg-neutral-100"
                    >
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </Command.Item>
                  ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation">
              {[
                { label: 'My Tasks', path: '/my-tasks' },
              ]
                .filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
                .map((n) => (
                  <Command.Item
                    key={n.path}
                    value={n.label}
                    onSelect={() => select(() => navigate(n.path))}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xs text-sm text-neutral-700 cursor-pointer aria-selected:bg-neutral-100"
                  >
                    <CheckSquare className="h-4 w-4 text-neutral-400" />
                    {n.label}
                  </Command.Item>
                ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
