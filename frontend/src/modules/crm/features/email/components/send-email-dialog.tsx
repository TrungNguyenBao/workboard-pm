import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { useEmailTemplates, useSendEmail, type EmailTemplate } from '../hooks/use-email-templates'

interface Props {
  workspaceId: string
  contactId: string
  dealId?: string
  leadId?: string
  onClose: () => void
  onSent?: () => void
}

function renderPreview(html: string, mergeValues: Record<string, string>): string {
  let out = html
  for (const [k, v] of Object.entries(mergeValues)) {
    out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
  }
  return out
}

export function SendEmailDialog({ workspaceId, contactId, dealId, leadId, onClose, onSent }: Props) {
  const { data, isLoading } = useEmailTemplates(workspaceId)
  const templates = data?.items ?? []
  const sendEmail = useSendEmail(workspaceId)

  const [selectedId, setSelectedId] = useState('')
  const [mergeValues, setMergeValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const selected = templates.find((t) => t.id === selectedId) as EmailTemplate | undefined

  const mergeTags = selected?.merge_tags
    ? Object.keys(selected.merge_tags as Record<string, string>)
    : []

  function handleSend() {
    if (!selectedId) return
    sendEmail.mutate(
      {
        template_id: selectedId,
        contact_id: contactId,
        deal_id: dealId,
        lead_id: leadId,
        merge_values: mergeValues,
      },
      {
        onSuccess: () => {
          onSent?.()
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Send Email</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Template selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Template</label>
            {isLoading ? (
              <div className="h-9 bg-muted animate-pulse rounded-md" />
            ) : (
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setMergeValues({}) }}
              >
                <option value="">— Select a template —</option>
                {templates.filter((t) => t.is_active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Merge tag inputs */}
          {selected && mergeTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Merge Values</p>
              {mergeTags.map((tag) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{`{{${tag}}}`}</span>
                  <input
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    placeholder={`Value for ${tag}`}
                    value={mergeValues[tag] ?? ''}
                    onChange={(e) => setMergeValues({ ...mergeValues, [tag]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Preview toggle */}
          {selected && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          )}

          {showPreview && selected && (
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Subject: <span className="text-foreground">{selected.subject}</span>
              </p>
              <div
                className="text-sm text-foreground prose prose-sm max-w-none max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: renderPreview(selected.body_html, mergeValues),
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedId || sendEmail.isPending}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            {sendEmail.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
