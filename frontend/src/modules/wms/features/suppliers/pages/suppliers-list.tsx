import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { WmsDataTable } from '../../shared/components/wms-data-table'
import { WmsPageHeader } from '../../shared/components/wms-page-header'
import { WmsPagination } from '../../shared/components/wms-pagination'
import { SupplierFormDialog } from '../components/supplier-form-dialog'
import { type Supplier, useDeleteSupplier, useSuppliers } from '../hooks/use-suppliers'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

export default function SuppliersListPage() {
  const { t } = useTranslation('wms')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)

  const { data } = useSuppliers(workspaceId, { search: search || undefined, page })
  const deleteSupplier = useDeleteSupplier(workspaceId)

  const columns = [
    { key: 'name', label: t('common:common.name'), render: (s: Supplier) => <span className="font-medium">{s.name}</span> },
    { key: 'email', label: t('common:common.email'), render: (s: Supplier) => s.contact_email ?? '—' },
    { key: 'phone', label: t('common:common.phone'), render: (s: Supplier) => s.phone ?? '—' },
    { key: 'address', label: 'Address', render: (s: Supplier) => s.address ?? '—' },
    { key: 'status', label: t('common:common.status'), render: (s: Supplier) => (
      <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? t('common:common.active') : t('common:common.inactive')}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (s: Supplier) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditSupplier(s); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(t('common:common.deleteConfirm', { name: s.name }))) {
            await deleteSupplier.mutateAsync(s.id)
            toast({ title: t('suppliers.deleted'), variant: 'success' })
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
        title={t('suppliers.title')}
        description={t('suppliers.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditSupplier(null); setDialogOpen(true) }}
        createLabel={t('suppliers.new')}
      />

      <WmsDataTable columns={columns} data={data?.items ?? []} keyFn={(s) => s.id} emptyMessage={t('suppliers.empty')} />
      <WmsPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        supplier={editSupplier}
      />
    </div>
  )
}
