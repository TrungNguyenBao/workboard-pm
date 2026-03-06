import { useState } from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { AssetFormDialog } from '../components/asset-form-dialog'
import { AssetAssignmentFormDialog } from '../components/asset-assignment-form-dialog'
import { type Asset, useAssets, useDeleteAsset } from '../hooks/use-assets'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  assigned: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-neutral-100 text-neutral-600',
}

function formatCurrency(value: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function AssetsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null)

  const { data, isLoading } = useAssets(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteAsset = useDeleteAsset(workspaceId)

  const columns: SimpleColumn<Asset>[] = [
    { key: 'name', label: 'Name', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'category', label: 'Category', render: (a) => a.category ?? '—' },
    { key: 'serial_number', label: 'Serial #', render: (a) => a.serial_number ?? '—' },
    { key: 'purchase_value', label: 'Value', render: (a) => formatCurrency(a.purchase_value) },
    { key: 'status', label: 'Status', render: (a) => (
      <Badge variant="outline" className={STATUS_COLORS[a.status] ?? ''}>{a.status}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-24', render: (a) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        {a.status === 'available' && (
          <button className="p-1 text-neutral-400 hover:text-blue-600" title="Assign" onClick={() => setAssignAsset(a)}>
            <UserPlus className="h-3.5 w-3.5" />
          </button>
        )}
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditAsset(a); setFormOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm('Delete this asset?')) {
            await deleteAsset.mutateAsync(a.id)
            toast({ title: 'Asset deleted', variant: 'success' })
          }
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Assets"
        description="Track company assets and assignments"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditAsset(null); setFormOpen(true) }}
        createLabel="New Asset"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="No assets found"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <AssetFormDialog open={formOpen} onOpenChange={setFormOpen} workspaceId={workspaceId} asset={editAsset} />
      {assignAsset && (
        <AssetAssignmentFormDialog
          open={!!assignAsset}
          onOpenChange={(o) => { if (!o) setAssignAsset(null) }}
          workspaceId={workspaceId}
          assetId={assignAsset.id}
          assetName={assignAsset.name}
        />
      )}
    </div>
  )
}
