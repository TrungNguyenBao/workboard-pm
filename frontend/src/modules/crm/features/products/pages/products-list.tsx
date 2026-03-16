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
import { ProductFormDialog } from '../components/product-form-dialog'
import { type ProductService, PRODUCT_TYPES, useProducts, useDeleteProduct } from '../hooks/use-products'

const PAGE_SIZE = 20

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency === 'VND' ? 'USD' : currency, maximumFractionDigits: 0 }).format(price)
}

export default function ProductsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductService | null>(null)

  const { data, isLoading } = useProducts(workspaceId, {
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    page,
    page_size: PAGE_SIZE,
  })
  const deleteProduct = useDeleteProduct(workspaceId)

  const columns: SimpleColumn<ProductService>[] = [
    { key: 'name', label: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'code', label: 'Code', render: (p) => <span className="text-muted-foreground font-mono text-xs">{p.code}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (p) => (
        <Badge variant="secondary">
          {PRODUCT_TYPES.find((t) => t.value === p.type)?.label ?? p.type}
        </Badge>
      ),
    },
    { key: 'category', label: 'Category', render: (p) => p.category ?? '-' },
    { key: 'unit_price', label: 'Unit Price', render: (p) => formatPrice(p.unit_price, p.currency) },
    {
      key: 'is_active',
      label: 'Status',
      render: (p) => (
        <Badge variant={(p.is_active ? 'success' : 'secondary') as BadgeVariant}>
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-16',
      render: (p) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-muted-foreground hover:text-foreground"
            onClick={() => { setEditProduct(p); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              if (window.confirm(`Delete "${p.name}"?`)) {
                await deleteProduct.mutateAsync(p.id)
                toast({ title: 'Product deleted', variant: 'success' })
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Products & Services"
        description="Manage your product and service catalog"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditProduct(null); setDialogOpen(true) }}
        createLabel="New Product"
      >
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PRODUCT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="No products yet"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        workspaceId={workspaceId}
        product={editProduct}
      />
    </div>
  )
}
