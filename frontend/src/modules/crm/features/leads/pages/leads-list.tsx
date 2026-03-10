import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, ArrowRightCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { LeadFormDialog } from '../components/lead-form-dialog'
import { LeadConvertDialog } from '../components/lead-convert-dialog'
import { LeadDistributeDialog } from '../components/lead-distribute-dialog'
import { type Lead, LEAD_STATUSES, LEAD_SOURCES, useLeads, useDeleteLead } from '../hooks/use-leads'

const PAGE_SIZE = 20

export default function LeadsListPage() {
  const { t } = useTranslation('crm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [distributeOpen, setDistributeOpen] = useState(false)

  const { data, isLoading } = useLeads(workspaceId, {
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    source: sourceFilter === 'all' ? undefined : sourceFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteLead = useDeleteLead(workspaceId)

  const columns: SimpleColumn<Lead>[] = [
    { key: 'name', label: 'Name', render: (l) => <span className="font-medium">{l.name}</span> },
    { key: 'email', label: 'Email', render: (l) => l.email ?? '-' },
    { key: 'source', label: 'Source', render: (l) => LEAD_SOURCES.find((s) => s.value === l.source)?.label ?? l.source },
    {
      key: 'status', label: 'Status', render: (l) => {
        const status = l.status;
        const variant = status === 'new' ? 'info' : status === 'contacted' ? 'secondary' : status === 'qualified' ? 'success' : status === 'lost' ? 'danger' : 'secondary'
        return <Badge variant={variant as any}>{LEAD_STATUSES.find((s) => s.value === l.status)?.label ?? l.status}</Badge>;
      },
    },
    { key: 'score', label: 'Score', render: (l) => l.score },
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
    </div>
  )
}
