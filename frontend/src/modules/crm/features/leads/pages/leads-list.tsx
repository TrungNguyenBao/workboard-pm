import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, ArrowRightCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { LeadFormDialog } from '../components/lead-form-dialog'
import { LeadConvertDialog } from '../components/lead-convert-dialog'
import { LeadDistributeDialog } from '../components/lead-distribute-dialog'
import { type Lead, LEAD_STATUSES, LEAD_SOURCES, useLeads, useDeleteLead, useBulkDisqualify } from '../hooks/use-leads'

const PAGE_SIZE = 20

export default function LeadsListPage() {
  const { t } = useTranslation('crm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const currentUser = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [myLeads, setMyLeads] = useState(false)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkReason, setBulkReason] = useState('')

  const { data, isLoading } = useLeads(workspaceId, {
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    source: sourceFilter === 'all' ? undefined : sourceFilter,
    owner_id: myLeads && currentUser ? currentUser.id : undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteLead = useDeleteLead(workspaceId)
  const bulkDisqualify = useBulkDisqualify(workspaceId)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleBulkDisqualify() {
    try {
      const result = await bulkDisqualify.mutateAsync({
        lead_ids: Array.from(selectedIds),
        reason: bulkReason,
      })
      toast({ title: `${result.disqualified} leads disqualified`, variant: 'success' })
      setSelectedIds(new Set())
      setBulkDialogOpen(false)
      setBulkReason('')
    } catch {
      toast({ title: 'Bulk disqualify failed', variant: 'error' })
    }
  }

  const columns: SimpleColumn<Lead>[] = [
    {
      key: 'select',
      label: '',
      className: 'w-8',
      render: (l) => (
        <input
          type="checkbox"
          checked={selectedIds.has(l.id)}
          onChange={() => toggleSelect(l.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-border accent-primary"
        />
      ),
    },
    { key: 'name', label: 'Name', render: (l) => <Link to={`/crm/leads/${l.id}`} className="font-medium hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{l.name}</Link> },
    { key: 'email', label: 'Email', render: (l) => l.email ?? '-' },
    { key: 'source', label: 'Source', render: (l) => LEAD_SOURCES.find((s) => s.value === l.source)?.label ?? l.source },
    {
      key: 'status', label: 'Status', render: (l) => {
        const st = l.status
        const variant = st === 'new' ? 'info' : st === 'contacted' ? 'secondary' : st === 'qualified' ? 'success' : st === 'lost' ? 'danger' : 'secondary'
        return <Badge variant={variant as BadgeVariant}>{LEAD_STATUSES.find((s) => s.value === l.status)?.label ?? l.status}</Badge>
      },
    },
    {
      key: 'score', label: 'Score', render: (l) => {
        const score = l.score ?? 0
        const level = score <= 30 ? 'cold' : score <= 60 ? 'warm' : 'hot'
        const levelVariant = level === 'cold' ? 'info' : level === 'warm' ? 'warning' : 'danger'
        const levelLabel = level === 'cold' ? 'Cold' : level === 'warm' ? 'Warm' : 'Hot'
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-sm font-medium w-6 text-right">{score}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
            </div>
            <Badge variant={levelVariant as BadgeVariant} className="text-xs px-1.5 py-0">{levelLabel}</Badge>
          </div>
        )
      },
    },
    {
      key: 'actions', label: '', className: 'w-24', render: (l) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-muted-foreground hover:text-primary" title="Convert to opportunity" onClick={() => setConvertLead(l)}>
            <ArrowRightCircle className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditLead(l); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
            if (window.confirm(t('common:common.deleteConfirm', { name: l.name }))) {
              await deleteLead.mutateAsync(l.id)
              toast({ title: 'Lead deleted', variant: 'success' })
            }
          }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Leads"
        description="Manage sales leads and track conversion"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditLead(null); setDialogOpen(true) }}
        createLabel="New Lead"
      >
        {selectedIds.size > 0 && (
          <button
            className="inline-flex items-center h-8 px-3 text-xs font-medium rounded-md border border-destructive text-destructive bg-card hover:bg-destructive/10"
            onClick={() => setBulkDialogOpen(true)}
          >
            Disqualify ({selectedIds.size})
          </button>
        )}
        <button
          className={`inline-flex items-center h-8 px-3 text-xs font-medium rounded-md border transition-colors ${myLeads ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-muted'}`}
          onClick={() => { setMyLeads((v) => !v); setPage(1) }}
        >
          {myLeads ? 'My Leads' : 'All Leads'}
        </button>
        <button
          className="inline-flex items-center h-8 px-3 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted"
          onClick={() => setDistributeOpen(true)}
        >
          Distribute
        </button>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {LEAD_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={toColumnDefs(columns)} data={data?.items ?? []} keyFn={(l) => l.id} isLoading={isLoading} emptyTitle="No leads yet" />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} lead={editLead} />
      <LeadConvertDialog lead={convertLead} onClose={() => setConvertLead(null)} workspaceId={workspaceId} />
      <LeadDistributeDialog open={distributeOpen} onOpenChange={setDistributeOpen} workspaceId={workspaceId} />

      {/* Bulk Disqualify Dialog */}
      {bulkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm space-y-4 shadow-lg">
            <p className="text-sm font-semibold">Disqualify {selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''}?</p>
            <p className="text-xs text-muted-foreground">This will mark all selected leads as disqualified.</p>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted"
                onClick={() => setBulkDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                onClick={handleBulkDisqualify}
                disabled={bulkDisqualify.isPending}
              >
                {bulkDisqualify.isPending ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
