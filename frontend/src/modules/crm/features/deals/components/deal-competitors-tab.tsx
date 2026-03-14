import { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import {
  useDealCompetitors,
  useCreateCompetitor,
  useUpdateCompetitor,
  useDeleteCompetitor,
  type Competitor,
} from '../hooks/use-deal-competitors'

const PRICE_OPTS = [
  { value: '', label: '— Unknown —' },
  { value: 'higher', label: 'Higher' },
  { value: 'similar', label: 'Similar' },
  { value: 'lower', label: 'Lower' },
]

const STATUS_OPTS = [
  { value: 'active', label: 'Active' },
  { value: 'won', label: 'Won against us' },
  { value: 'lost', label: 'Lost to us' },
]

interface FormState {
  name: string
  strengths: string
  weaknesses: string
  price_comparison: string
  status: string
}

const emptyForm = (): FormState => ({
  name: '', strengths: '', weaknesses: '', price_comparison: '', status: 'active',
})

function fromCompetitor(c: Competitor): FormState {
  return {
    name: c.name,
    strengths: c.strengths ?? '',
    weaknesses: c.weaknesses ?? '',
    price_comparison: c.price_comparison ?? '',
    status: c.status,
  }
}

interface CompetitorFormProps {
  initial?: FormState
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  isPending?: boolean
}

function CompetitorForm({ initial, onSubmit, onCancel, isPending }: CompetitorFormProps) {
  const [form, setForm] = useState<FormState>(initial ?? emptyForm())
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      price_comparison: form.price_comparison || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Competitor Name</label>
          <input required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.name} onChange={set('name')} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Price vs Us</label>
          <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.price_comparison} onChange={set('price_comparison')}>
            {PRICE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.status} onChange={set('status')}>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Strengths</label>
          <textarea rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
            value={form.strengths} onChange={set('strengths')} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Weaknesses</label>
          <textarea rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
            value={form.weaknesses} onChange={set('weaknesses')} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

const PRICE_BADGE: Record<string, string> = {
  higher: 'bg-red-500/10 text-red-600',
  similar: 'bg-yellow-500/10 text-yellow-600',
  lower: 'bg-green-500/10 text-green-600',
}

interface Props {
  workspaceId: string
  dealId: string
}

export function DealCompetitorsTab({ workspaceId, dealId }: Props) {
  const { data: competitors = [], isLoading } = useDealCompetitors(workspaceId, dealId)
  const createCompetitor = useCreateCompetitor(workspaceId, dealId)
  const updateCompetitor = useUpdateCompetitor(workspaceId, dealId)
  const deleteCompetitor = useDeleteCompetitor(workspaceId, dealId)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Competitor | null>(null)

  if (isLoading) return (
    <div className="space-y-2 p-4">
      {[0, 1].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
    </div>
  )

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Competitors ({competitors.length})
          </span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {showAdd && (
        <CompetitorForm
          onSubmit={(d) => createCompetitor.mutate(d, { onSuccess: () => setShowAdd(false) })}
          onCancel={() => setShowAdd(false)}
          isPending={createCompetitor.isPending}
        />
      )}

      {competitors.map((c) => (
        <div key={c.id}>
          {editing?.id === c.id ? (
            <CompetitorForm
              initial={fromCompetitor(c)}
              onSubmit={(d) => updateCompetitor.mutate({ competitorId: c.id, ...d }, { onSuccess: () => setEditing(null) })}
              onCancel={() => setEditing(null)}
              isPending={updateCompetitor.isPending}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  {c.price_comparison && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PRICE_BADGE[c.price_comparison] ?? ''}`}>
                      {c.price_comparison}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {c.status}
                  </span>
                </div>
                {(c.strengths || c.weaknesses) && (
                  <div className="mt-1 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                    {c.strengths && <p><span className="font-medium text-green-600">+</span> {c.strengths}</p>}
                    {c.weaknesses && <p><span className="font-medium text-red-500">−</span> {c.weaknesses}</p>}
                  </div>
                )}
              </div>
              <button onClick={() => setEditing(c)}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { if (confirm('Remove competitor?')) deleteCompetitor.mutate(c.id) }}
                className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {competitors.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground italic">No competitors tracked for this deal.</p>
      )}
    </div>
  )
}
