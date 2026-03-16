import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useLeads, LEAD_STATUSES, LEAD_SOURCES, type BantValues } from '../hooks/use-leads'
import { LeadBantChecklist } from '../components/lead-bant-checklist'
import { useActivities } from '../../activities/hooks/use-activities'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="w-28 text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export default function CrmLeadDetailPage() {
  const { leadId = '' } = useParams<{ leadId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''

  const { data: leadsData, isLoading } = useLeads(workspaceId, { page: 1, page_size: 100 })
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities(workspaceId, {
    lead_id: leadId,
    page_size: 20,
  })

  const lead = leadsData?.items.find((l) => l.id === leadId)

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-4 sm:p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">Lead not found.</p>
      </div>
    )
  }

  const statusLabel = LEAD_STATUSES.find((s) => s.value === lead.status)?.label ?? lead.status
  const sourceLabel = LEAD_SOURCES.find((s) => s.value === lead.source)?.label ?? lead.source
  const statusVariant =
    lead.status === 'new' ? 'info'
    : lead.status === 'qualified' ? 'success'
    : lead.status === 'lost' ? 'danger'
    : 'secondary'

  const cfv = lead.custom_field_values ?? {}
  const bantInitial: BantValues = {
    _bant_budget: cfv._bant_budget ?? '',
    _bant_authority: cfv._bant_authority ?? '',
    _bant_need: cfv._bant_need ?? '',
    _bant_timeline: cfv._bant_timeline ?? '',
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold text-foreground">{lead.name}</h2>
          <Badge variant={statusVariant as any}>{statusLabel}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Info */}
        <div className="border border-border rounded-lg p-4 bg-card space-y-1">
          <p className="text-sm font-medium text-foreground mb-3">Lead Information</p>
          <InfoRow label="Email" value={lead.email ?? '-'} />
          <InfoRow label="Phone" value={lead.phone ?? '-'} />
          <InfoRow label="Source" value={sourceLabel} />
          <InfoRow label="Score" value={String(lead.score ?? 0)} />
          <InfoRow label="Owner" value={lead.owner_id ?? 'Unassigned'} />
          <InfoRow label="Created" value={new Date(lead.created_at).toLocaleDateString()} />
        </div>

        {/* BANT Checklist */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <LeadBantChecklist
            workspaceId={workspaceId}
            leadId={leadId}
            initialValues={bantInitial}
          />
        </div>
      </div>

      {/* Activities */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium text-foreground mb-3">
          Activities
          {activitiesData && activitiesData.total > 0 && (
            <span className="ml-2 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {activitiesData.total}
            </span>
          )}
        </p>
        {activitiesLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
          </div>
        ) : !activitiesData || activitiesData.items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No activities yet</p>
        ) : (
          <div className="divide-y divide-border">
            {activitiesData.items.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{a.type}</Badge>
                  <span className="text-sm">{a.subject}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
