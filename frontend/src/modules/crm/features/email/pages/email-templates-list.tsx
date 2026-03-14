import { useState } from 'react'
import { Plus, Pencil, Trash2, Mail, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  type EmailTemplate,
} from '../hooks/use-email-templates'

const CATEGORIES = ['welcome', 'follow_up', 'proposal', 'meeting', 'general']

interface TemplateFormProps {
  initial?: Partial<EmailTemplate>
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  isPending?: boolean
}

function TemplateForm({ initial, onSubmit, onCancel, isPending }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [bodyHtml, setBodyHtml] = useState(initial?.body_html ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'general')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, subject, body_html: bodyHtml, category, is_active: isActive })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <input required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Subject</label>
        <input required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Body HTML <span className="text-muted-foreground/60">(use {'{{name}}'} for merge tags)</span>
        </label>
        <textarea required rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {isPending ? 'Saving…' : initial?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default function EmailTemplatesListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data, isLoading, isError } = useEmailTemplates(workspaceId)
  const templates = data?.items ?? []
  const createTemplate = useCreateEmailTemplate(workspaceId)
  const updateTemplate = useUpdateEmailTemplate(workspaceId)
  const deleteTemplate = useDeleteEmailTemplate(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)

  if (isLoading) return (
    <div className="p-6 space-y-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
    </div>
  )

  if (isError) return (
    <div className="p-6 flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" /> Failed to load email templates.
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Email Templates</h2>
            <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">New Template</h3>
          <TemplateForm
            onSubmit={(d) => createTemplate.mutate(d, { onSuccess: () => setShowCreate(false) })}
            onCancel={() => setShowCreate(false)}
            isPending={createTemplate.isPending}
          />
        </div>
      )}

      {editing && (
        <div className="rounded-lg border border-primary/50 bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Edit: {editing.name}</h3>
          <TemplateForm
            initial={editing}
            onSubmit={(d) => updateTemplate.mutate({ templateId: editing.id, ...d }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)}
            isPending={updateTemplate.isPending}
          />
        </div>
      )}

      <div className="space-y-2">
        {templates.map((tpl) => (
          <div key={tpl.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${tpl.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {tpl.is_active ? 'active' : 'inactive'}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tpl.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{tpl.subject}</p>
            </div>
            <button onClick={() => setEditing(tpl)}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => { if (confirm('Delete this template?')) deleteTemplate.mutate(tpl.id) }}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No templates yet.</p>
        )}
      </div>
    </div>
  )
}
