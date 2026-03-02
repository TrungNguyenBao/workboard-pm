import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { WmsDataTable } from '../../shared/components/wms-data-table'
import { WmsPageHeader } from '../../shared/components/wms-page-header'
import { WmsPagination } from '../../shared/components/wms-pagination'
import { WarehouseFormDialog } from '../components/warehouse-form-dialog'
import { type Warehouse, useDeleteWarehouse, useWarehouses } from '../hooks/use-warehouses'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

export default function WarehousesListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null)

  const { data } = useWarehouses(workspaceId, { search: search || undefined, page })
  const deleteWarehouse = useDeleteWarehouse(workspaceId)

  const columns = [
    { key: 'name', label: 'Name', render: (w: Warehouse) => <span className="font-medium">{w.name}</span> },
    { key: 'location', label: 'Location', render: (w: Warehouse) => w.location ?? '—' },
    { key: 'manager', label: 'Manager', render: (w: Warehouse) => w.manager_name ?? '—' },
    { key: 'address', label: 'Address', render: (w: Warehouse) => w.address ?? '—' },
    { key: 'status', label: 'Status', render: (w: Warehouse) => (
      <Badge variant={w.is_active ? 'default' : 'secondary'}>{w.is_active ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (w: Warehouse) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditWarehouse(w); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(`Delete "${w.name}"?`)) {
            await deleteWarehouse.mutateAsync(w.id)
            toast({ title: 'Warehouse deleted', variant: 'success' })
          }
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="flex flex-col h-full">
      <WmsPageHeader
        title="Warehouses"
        description="Manage warehouse locations"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditWarehouse(null); setDialogOpen(true) }}
        createLabel="New warehouse"
      />

      <WmsDataTable columns={columns} data={data?.items ?? []} keyFn={(w) => w.id} emptyMessage="No warehouses yet" />
      <WmsPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />

      <WarehouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        warehouse={editWarehouse}
      />
    </div>
  )
}
