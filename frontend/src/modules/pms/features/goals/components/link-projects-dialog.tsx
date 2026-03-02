import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useLinkProject, useUnlinkProject } from '../hooks/use-goals'
import api from '@/shared/lib/api'

interface Project { id: string; name: string; color: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  goalId: string
  linkedProjectIds: string[]
}

export function LinkProjectsDialog({ open, onOpenChange, workspaceId, goalId, linkedProjectIds }: Props) {
  const [search, setSearch] = useState('')
  const linkProject = useLinkProject(workspaceId, goalId)
  const unlinkProject = useUnlinkProject(workspaceId, goalId)

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: () => api.get(`/pms/workspaces/${workspaceId}/projects`).then((r) => r.data),
    enabled: open && !!workspaceId,
  })

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function toggle(projectId: string, isLinked: boolean) {
    if (isLinked) {
      await unlinkProject.mutateAsync(projectId)
    } else {
      await linkProject.mutateAsync(projectId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Link projects</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-4">No projects found</p>
          )}
          {filtered.map((p) => {
            const isLinked = linkedProjectIds.includes(p.id)
            return (
              <label
                key={p.id}
                className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-neutral-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isLinked}
                  onChange={() => toggle(p.id, isLinked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-neutral-800 truncate">{p.name}</span>
              </label>
            )
          })}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
