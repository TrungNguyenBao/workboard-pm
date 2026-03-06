import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { ProductFormDialog } from '../components/product-form-dialog'
import { type Product, useDeleteProduct, useProducts } from '../hooks/use-products'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

const PAGE_SIZE = 20

export default function ProductsListPage() {
  const { t } = useTranslation('wms')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const { data, isLoading } = useProducts(workspaceId, {
    search: search || undefined,
    category: category || undefined,
    page,
  })
  const deleteProduct = useDeleteProduct(workspaceId)

  const columns: SimpleColumn<Product>[] = [
    { key: 'name', label: t('products.name'), render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'sku', label: t('products.sku'), render: (p) => p.sku },
    { key: 'category', label: t('products.category'), render: (p) => (
      <Badge variant={p.category === 'equipment' ? 'default' : 'secondary'}>{p.category}</Badge>
    )},
    { key: 'unit', label: t('products.unit'), render: (p) => p.unit },
    { key: 'serial', label: t('products.serialTracked'), render: (p) => p.is_serial_tracked ? t('common:common.yes') : t('common:common.no') },
    { key: 'status', label: t('common:common.status'), render: (p) => (
      <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? t('common:common.active') : t('common:common.inactive')}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (p) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditProduct(p); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(t('common:common.deleteConfirm', { name: p.name }))) {
            await deleteProduct.mutateAsync(p.id)
            toast({ title: t('products.deleted'), variant: 'success' })
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
        title={t('products.title')}
        description={t('products.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditProduct(null); setDialogOpen(true) }}
        createLabel={t('products.new')}
      >
        <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder={t('products.allCategories')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.allCategories')}</SelectItem>
            <SelectItem value="equipment">{t('products.equipment')}</SelectItem>
            <SelectItem value="accessory">{t('products.accessory')}</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(p) => p.id}
        isLoading={isLoading}
        emptyTitle={t('products.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        product={editProduct}
      />
    </div>
  )
}
