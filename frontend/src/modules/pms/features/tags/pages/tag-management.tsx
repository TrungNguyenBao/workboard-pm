import { useState } from 'react'
import { Trash2, Pencil, Check, X, Plus } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/use-tags'
import type { Tag } from '../hooks/use-tags'

const PRESET_COLORS = [
  '#5E6AD2', '#26B5CE', '#4CB782', '#F2994A',
  '#EB5757', '#BB87FC', '#F7C948', '#0F7488',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#000' : 'transparent',
          }}
          title={c}
        />
      ))}
    </div>
  )
}

function TagRow({ tag, workspaceId }: { tag: Tag; workspaceId: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const update = useUpdateTag(workspaceId)
  const remove = useDeleteTag(workspaceId)

  function save() {
    if (!name.trim()) return
    update.mutate({ tagId: tag.id, name: name.trim(), color }, {
      onSuccess: () => setEditing(false),
    })
  }

  function cancel() {
    setName(tag.name)
    setColor(tag.color)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          className="text-sm border rounded px-2 py-0.5 flex-1 max-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <ColorPicker value={color} onChange={setColor} />
        <button onClick={save} disabled={update.isPending} className="text-primary hover:text-primary/80 ml-1">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={cancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border group">
      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
      <span className="text-sm flex-1">{tag.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground p-1 rounded">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {confirmDelete ? (
          <>
            <span className="text-xs text-destructive mr-1">Delete?</span>
            <button
              onClick={() => remove.mutate(tag.id)}
              disabled={remove.isPending}
              className="text-xs text-destructive font-medium hover:underline"
            >
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground ml-1 hover:underline">
              No
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive p-1 rounded">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function NewTagForm({ workspaceId }: { workspaceId: string }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const create = useCreateTag(workspaceId)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate({ name: name.trim(), color }, {
      onSuccess: () => { setName(''); setColor(PRESET_COLORS[0]) },
    })
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-3 px-4 py-3">
      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New tag name..."
        className="text-sm border rounded px-2 py-1 flex-1 max-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <ColorPicker value={color} onChange={setColor} />
      <button
        type="submit"
        disabled={!name.trim() || create.isPending}
        className="flex items-center gap-1 text-xs bg-primary text-white px-2.5 py-1 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    </form>
  )
}

export default function TagManagementPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const { data: tags = [], isLoading } = useTags(workspaceId)

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No workspace selected.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-1">Tags</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage workspace-level tags used across all projects.</p>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {tags.length} tag{tags.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">No tags yet. Create one below.</div>
        ) : (
          tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} workspaceId={workspaceId} />
          ))
        )}

        <NewTagForm workspaceId={workspaceId} />
      </div>
    </div>
  )
}
