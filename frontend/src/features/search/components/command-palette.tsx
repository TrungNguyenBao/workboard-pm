import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { Search, CheckSquare } from 'lucide-react'
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
interface TaskResult { id: string; title: string; project_id: string; status: string }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [query, setQuery] = useState('')
  const [taskResults, setTaskResults] = useState<(TaskResult & { projectName: string })[]>([])
  const [searching, setSearching] = useState(false)

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
    queryFn: () => api.get(`/pms/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  const searchTasks = useCallback(async (q: string) => {
    if (q.length < 2 || !projects.length) { setTaskResults([]); return }
    setSearching(true)
    try {
      const results = await Promise.all(
        projects.map((p) =>
          api
            .get(`/pms/projects/${p.id}/tasks/search`, { params: { q, limit: 5 } })
            .then((r) => (r.data as TaskResult[]).map((t) => ({ ...t, projectName: p.name }))),
        ),
      )
      setTaskResults(results.flat().slice(0, 10))
    } catch {
      setTaskResults([])
    } finally {
      setSearching(false)
    }
  }, [projects])

  useEffect(() => {
    const timer = setTimeout(() => searchTasks(query), 300)
    return () => clearTimeout(timer)
  }, [query, searchTasks])

  function select(cb: () => void) {
    onOpenChange(false)
    setQuery('')
    setTaskResults([])
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
          <Command.List className="max-h-80 overflow-y-auto p-1">
            <Command.Empty className="py-6 text-center text-sm text-neutral-400">
              {searching ? 'Searching…' : 'No results found'}
            </Command.Empty>

            {taskResults.length > 0 && (
              <Command.Group heading="Tasks">
                {taskResults.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={t.title}
                    onSelect={() => select(() => navigate(`/pms/projects/${t.project_id}/board`))}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xs text-sm text-neutral-700 cursor-pointer aria-selected:bg-neutral-100"
                  >
                    <CheckSquare className={`h-3.5 w-3.5 flex-shrink-0 ${t.status === 'completed' ? 'text-primary' : 'text-neutral-300'}`} />
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-neutral-400 flex-shrink-0">{t.projectName}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {projects.length > 0 && (
              <Command.Group heading="Projects">
                {projects
                  .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
                  .map((p) => (
                    <Command.Item
                      key={p.id}
                      value={p.name}
                      onSelect={() => select(() => navigate(`/pms/projects/${p.id}/board`))}
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
                { label: 'My Tasks', path: '/pms/my-tasks' },
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
