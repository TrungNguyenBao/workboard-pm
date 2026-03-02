import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { WmsDataTable } from '../../shared/components/wms-data-table'
import { WmsPageHeader } from '../../shared/components/wms-page-header'
import { WmsPagination } from '../../shared/components/wms-pagination'
import { DeviceFormDialog } from '../components/device-form-dialog'
import { type Device, useDeleteDevice, useDevices } from '../hooks/use-devices'
import { useProducts } from '../../products/hooks/use-products'
import { useWarehouses } from '../../warehouses/hooks/use-warehouses'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  in_stock: 'default',
  reserved: 'secondary',
  deployed: 'default',
  in_repair: 'secondary',
  retired: 'secondary',
}

const STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  reserved: 'Reserved',
  deployed: 'Deployed',
  in_repair: 'In Repair',
  retired: 'Retired',
}

export default function DevicesListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDevice, setEditDevice] = useState<Device | null>(null)

  const { data } = useDevices(workspaceId, {
    search: search || undefined,
    status: statusFilter || undefined,
    product_id: productFilter || undefined,
    warehouse_id: warehouseFilter || undefined,
    page,
  })
  const { data: productsData } = useProducts(workspaceId, { page_size: 100 })
  const { data: warehousesData } = useWarehouses(workspaceId, { page_size: 100 })
  const deleteDevice = useDeleteDevice(workspaceId)

  const columns = [
    { key: 'serial', label: 'Serial Number', render: (d: Device) => <span className="font-medium font-mono">{d.serial_number}</span> },
    { key: 'product', label: 'Product', render: (d: Device) => d.product_name ?? '—' },
    { key: 'warehouse', label: 'Warehouse', render: (d: Device) => d.warehouse_name ?? '—' },
    { key: 'status', label: 'Status', render: (d: Device) => (
      <Badge variant={(STATUS_COLORS[d.status] ?? 'secondary') as 'default' | 'secondary'}>
        {STATUS_LABELS[d.status] ?? d.status}
      </Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (d: Device) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditDevice(d); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(`Delete device "${d.serial_number}"?`)) {
            await deleteDevice.mutateAsync(d.id)
            toast({ title: 'Device deleted', variant: 'success' })
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
        title="Devices"
        description="Track serial-numbered devices"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditDevice(null); setDialogOpen(true) }}
        createLabel="New device"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={(v) => { setProductFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All products" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            {(productsData?.items ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <WmsDataTable columns={columns} data={data?.items ?? []} keyFn={(d) => d.id} emptyMessage="No devices yet" />
      <WmsPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />

      <DeviceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        device={editDevice}
      />
    </div>
  )
}
