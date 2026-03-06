import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { AccountFormDialog } from '../components/account-form-dialog'
import { type Account, useAccounts, useDeleteAccount } from '../hooks/use-accounts'

const PAGE_SIZE = 20

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function AccountsListPage() {
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)

  const { data, isLoading } = useAccounts(workspaceId, { search: search || undefined, page, page_size: PAGE_SIZE })
  const deleteAccount = useDeleteAccount(workspaceId)

  const columns: SimpleColumn<Account>[] = [
    { key: 'name', label: 'Name', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'industry', label: 'Industry', render: (a) => a.industry ?? '-' },
    { key: 'revenue', label: 'Revenue', render: (a) => formatCurrency(a.total_revenue) },
    {
      key: 'status', label: 'Status', render: (a) => (
        <Badge variant={a.status === 'active' ? 'default' : 'secondary'}>{a.status}</Badge>
      ),
    },
    {
      key: 'actions', label: '', className: 'w-24', render: (a) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-neutral-400 hover:text-blue-600" onClick={() => navigate(`/crm/accounts/${a.id}`)}>
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditAccount(a); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
            if (window.confirm(`Delete "${a.name}"?`)) {
              await deleteAccount.mutateAsync(a.id)
              toast({ title: 'Account deleted', variant: 'success' })
            }
          }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Accounts"
        description="Manage company accounts"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditAccount(null); setDialogOpen(true) }}
        createLabel="New Account"
      />
      <DataTable columns={toColumnDefs(columns)} data={data?.items ?? []} keyFn={(a) => a.id} isLoading={isLoading} emptyTitle="No accounts yet" />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <AccountFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} account={editAccount} />
    </div>
  )
}
