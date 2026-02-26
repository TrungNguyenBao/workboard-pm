import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If true, dialog cannot be dismissed (first-time setup) */
  required?: boolean
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateWorkspaceDialog({ open, onOpenChange, required }: Props) {
  const qc = useQueryClient()
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!slugTouched) setSlug(toSlug(val))
  }

  function handleSlugChange(val: string) {
    setSlug(val)
    setSlugTouched(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/workspaces', { name: name.trim(), slug: slug.trim() })
      setActiveWorkspace(data.id)
      qc.invalidateQueries({ queryKey: ['workspaces'] })
      toast({ title: `Workspace "${data.name}" created`, variant: 'success' })
      setName('')
      setSlug('')
      setSlugTouched(false)
      onOpenChange(false)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ title: 'Failed to create workspace', description: detail ?? 'Please try again', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={required ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-slug">
              URL slug
              <span className="ml-1 text-xs text-neutral-400 font-normal">
                (letters, numbers, hyphens)
              </span>
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400 shrink-0">workboard.app/</span>
              <Input
                id="ws-slug"
                placeholder="acme-corp"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                pattern="[a-z0-9-]+"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            {!required && (
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading || !name.trim() || !slug.trim()}>
              {loading ? 'Creating…' : 'Create workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
