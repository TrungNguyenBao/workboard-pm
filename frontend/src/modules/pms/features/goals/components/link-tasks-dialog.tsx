import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useLinkTask, useUnlinkTask } from '../hooks/use-goals'
import api from '@/shared/lib/api'

interface Project { id: string; name: string; color: string }
interface Task { id: string; title: string; status: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  goalId: string
  linkedTaskIds: string[]
}

export function LinkTasksDialog({ open, onOpenChange, workspaceId, goalId, linkedTaskIds }: Props) {
  const [search, setSearch] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const linkTask = useLinkTask(workspaceId, goalId)
  const unlinkTask = useUnlinkTask(workspaceId, goalId)

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: () => api.get(`/pms/workspaces/${workspaceId}/projects`).then((r) => r.data),
    enabled: open && !!workspaceId,
  })

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', selectedProjectId],
    queryFn: () => api.get(`/pms/projects/${selectedProjectId}/tasks`).then((r) => r.data),
    enabled: !!selectedProjectId,
  })

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  async function toggle(taskId: string, isLinked: boolean) {
    if (isLinked) {
      await unlinkTask.mutateAsync(taskId)
    } else {
      await linkTask.mutateAsync(taskId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Link tasks</DialogTitle>
        </DialogHeader>
        <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSearch('') }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project first…" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProjectId && (
          <>
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2"
            />
            <div className="max-h-56 overflow-y-auto space-y-1 mt-1">
              {filtered.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">No tasks found</p>
              )}
              {filtered.map((t) => {
                const isLinked = linkedTaskIds.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-neutral-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isLinked}
                      onChange={() => toggle(t.id, isLinked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-neutral-800 truncate flex-1">{t.title}</span>
                    {t.status === 'completed' && (
                      <span className="text-xs text-green-600 flex-shrink-0">Done</span>
                    )}
                  </label>
                )
              })}
            </div>
          </>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
