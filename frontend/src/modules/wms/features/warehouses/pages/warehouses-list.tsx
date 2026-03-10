import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { WarehouseFormDialog } from '../components/warehouse-form-dialog'
import { type Warehouse, useDeleteWarehouse, useWarehouses } from '../hooks/use-warehouses'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

const PAGE_SIZE = 20

export default function WarehousesListPage() {
  const { t } = useTranslation('wms')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null)

  const { data, isLoading } = useWarehouses(workspaceId, { search: search || undefined, page })
  const deleteWarehouse = useDeleteWarehouse(workspaceId)

  const columns: SimpleColumn<Warehouse>[] = [
    { key: 'name', label: t('common:common.name'), render: (w) => <span className="font-medium">{w.name}</span> },
    { key: 'location', label: 'Location', render: (w) => w.location ?? '—' },
    { key: 'manager', label: 'Manager', render: (w) => w.manager_name ?? '—' },
    { key: 'address', label: 'Address', render: (w) => w.address ?? '—' },
    { key: 'status', label: t('common:common.status'), render: (w) => (
      <Badge variant={w.is_active ? 'success' : 'secondary'}>{w.is_active ? t('common:common.active') : t('common:common.inactive')}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (w) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditWarehouse(w); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
          if (window.confirm(t('common:common.deleteConfirm', { name: w.name }))) {
            await deleteWarehouse.mutateAsync(w.id)
            toast({ title: t('warehouses.deleted'), variant: 'success' })
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
        title={t('warehouses.title')}
        description={t('warehouses.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditWarehouse(null); setDialogOpen(true) }}
        createLabel={t('warehouses.new')}
      />

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(w) => w.id}
        isLoading={isLoading}
        emptyTitle={t('warehouses.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <WarehouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        warehouse={editWarehouse}
      />
    </div>
  )
}
