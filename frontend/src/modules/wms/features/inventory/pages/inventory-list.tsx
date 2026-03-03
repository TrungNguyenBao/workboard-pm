import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { WmsDataTable } from '../../shared/components/wms-data-table'
import { WmsPageHeader } from '../../shared/components/wms-page-header'
import { WmsPagination } from '../../shared/components/wms-pagination'
import { InventoryItemFormDialog } from '../components/inventory-item-form-dialog'
import { type InventoryItem, useDeleteInventoryItem, useInventoryItems } from '../hooks/use-inventory-items'
import { useWarehouses } from '../../warehouses/hooks/use-warehouses'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

export default function InventoryListPage() {
  const { t } = useTranslation('wms')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  const { data } = useInventoryItems(workspaceId, {
    warehouse_id: warehouseFilter || undefined,
    page,
  })
  const { data: warehousesData } = useWarehouses(workspaceId, { page_size: 100 })
  const deleteItem = useDeleteInventoryItem(workspaceId)

  const columns = [
    { key: 'sku', label: t('products.sku'), render: (i: InventoryItem) => <span className="font-mono">{i.sku}</span> },
    { key: 'name', label: t('common:common.name'), render: (i: InventoryItem) => <span className="font-medium">{i.name}</span> },
    { key: 'product', label: t('products.title'), render: (i: InventoryItem) => i.product_name ?? '—' },
    { key: 'quantity', label: 'Qty', render: (i: InventoryItem) => (
      <span className={i.quantity <= i.min_threshold && i.min_threshold > 0 ? 'text-red-600 font-medium' : ''}>
        {i.quantity} {i.unit}
      </span>
    )},
    { key: 'threshold', label: 'Min', render: (i: InventoryItem) => i.min_threshold > 0 ? i.min_threshold : '—' },
    { key: 'low', label: '', render: (i: InventoryItem) =>
      i.quantity <= i.min_threshold && i.min_threshold > 0
        ? <Badge variant="secondary" className="text-red-600">Low</Badge>
        : null
    },
    { key: 'actions', label: '', className: 'w-20', render: (i: InventoryItem) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditItem(i); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(t('common:common.deleteConfirm', { name: i.name }))) {
            await deleteItem.mutateAsync(i.id)
            toast({ title: 'Item deleted', variant: 'success' })
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
        title={t('inventory.title')}
        description={t('inventory.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditItem(null); setDialogOpen(true) }}
        createLabel={t('inventory.new')}
      >
        <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All warehouses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All warehouses</SelectItem>
            {(warehousesData?.items ?? []).map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </WmsPageHeader>

      <WmsDataTable columns={columns} data={data?.items ?? []} keyFn={(i) => i.id} emptyMessage={t('inventory.empty')} />
      <WmsPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />

      <InventoryItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        item={editItem}
      />
    </div>
  )
}
