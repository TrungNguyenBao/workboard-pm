import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { SupplierFormDialog } from '../components/supplier-form-dialog'
import { type Supplier, useDeleteSupplier, useSuppliers } from '../hooks/use-suppliers'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

const PAGE_SIZE = 20

export default function SuppliersListPage() {
  const { t } = useTranslation('wms')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)

  const { data, isLoading } = useSuppliers(workspaceId, { search: search || undefined, page })
  const deleteSupplier = useDeleteSupplier(workspaceId)

  const columns: SimpleColumn<Supplier>[] = [
    { key: 'name', label: t('common:common.name'), render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'email', label: t('common:common.email'), render: (s) => s.contact_email ?? '—' },
    { key: 'phone', label: t('common:common.phone'), render: (s) => s.phone ?? '—' },
    { key: 'address', label: 'Address', render: (s) => s.address ?? '—' },
    { key: 'status', label: t('common:common.status'), render: (s) => (
      <Badge variant={s.is_active ? 'success' : 'secondary'}>{s.is_active ? t('common:common.active') : t('common:common.inactive')}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (s) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditSupplier(s); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
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
      <PageHeader
        title={t('suppliers.title')}
        description={t('suppliers.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditSupplier(null); setDialogOpen(true) }}
        createLabel={t('suppliers.new')}
      />

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(s) => s.id}
        isLoading={isLoading}
        emptyTitle={t('suppliers.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        supplier={editSupplier}
      />
    </div>
  )
}
