import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { WmsDataTable } from '../../shared/components/wms-data-table'
import { WmsPageHeader } from '../../shared/components/wms-page-header'
import { WmsPagination } from '../../shared/components/wms-pagination'
import { ProductFormDialog } from '../components/product-form-dialog'
import { type Product, useDeleteProduct, useProducts } from '../hooks/use-products'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

export default function ProductsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const { data } = useProducts(workspaceId, {
    search: search || undefined,
    category: category || undefined,
    page,
  })
  const deleteProduct = useDeleteProduct(workspaceId)

  const columns = [
    { key: 'name', label: 'Name', render: (p: Product) => <span className="font-medium">{p.name}</span> },
    { key: 'sku', label: 'SKU', render: (p: Product) => p.sku },
    { key: 'category', label: 'Category', render: (p: Product) => (
      <Badge variant={p.category === 'equipment' ? 'default' : 'secondary'}>{p.category}</Badge>
    )},
    { key: 'unit', label: 'Unit', render: (p: Product) => p.unit },
    { key: 'serial', label: 'Serial Tracked', render: (p: Product) => p.is_serial_tracked ? 'Yes' : 'No' },
    { key: 'status', label: 'Status', render: (p: Product) => (
      <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (p: Product) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditProduct(p); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(`Delete "${p.name}"?`)) {
            await deleteProduct.mutateAsync(p.id)
            toast({ title: 'Product deleted', variant: 'success' })
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
        title="Products"
        description="Manage product catalog"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditProduct(null); setDialogOpen(true) }}
        createLabel="New product"
      >
        <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
          </SelectContent>
        </Select>
      </WmsPageHeader>

      <WmsDataTable columns={columns} data={data?.items ?? []} keyFn={(p) => p.id} emptyMessage="No products yet" />
      <WmsPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        product={editProduct}
      />
    </div>
  )
}
