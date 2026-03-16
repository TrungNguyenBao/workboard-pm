import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { CampaignFormDialog } from '../components/campaign-form-dialog'
import {
  type Campaign, CAMPAIGN_TYPES, CAMPAIGN_STATUSES,
  useCampaigns, useDeleteCampaign,
} from '../hooks/use-campaigns'

const PAGE_SIZE = 20

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function CampaignsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)

  const { data, isLoading } = useCampaigns(workspaceId, {
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteCampaign = useDeleteCampaign(workspaceId)

  const columns: SimpleColumn<Campaign>[] = [
    { key: 'name', label: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'type', label: 'Type', render: (c) => CAMPAIGN_TYPES.find((t) => t.value === c.type)?.label ?? c.type },
    { key: 'budget', label: 'Budget', render: (c) => formatCurrency(c.budget) },
    { key: 'cost', label: 'Actual Cost', render: (c) => formatCurrency(c.actual_cost) },
    {
      key: 'status', label: 'Status', render: (c) => {
        const status = c.status;
        return <Badge variant={(status === 'active' ? 'success' : status === 'draft' ? 'secondary' : status === 'paused' ? 'warning' : 'danger') as BadgeVariant}>
          {CAMPAIGN_STATUSES.find((s) => s.value === c.status)?.label ?? c.status}
        </Badge>;
      },
    },
    {
      key: 'actions', label: '', className: 'w-20', render: (c) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditCampaign(c); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
            if (window.confirm(`Delete "${c.name}"?`)) {
              await deleteCampaign.mutateAsync(c.id)
              toast({ title: 'Campaign deleted', variant: 'success' })
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
        title="Campaigns"
        description="Manage marketing campaigns"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditCampaign(null); setDialogOpen(true) }}
        createLabel="New Campaign"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CAMPAIGN_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>
      <DataTable columns={toColumnDefs(columns)} data={data?.items ?? []} keyFn={(c) => c.id} isLoading={isLoading} emptyTitle="No campaigns yet" />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <CampaignFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} campaign={editCampaign} />
    </div>
  )
}
