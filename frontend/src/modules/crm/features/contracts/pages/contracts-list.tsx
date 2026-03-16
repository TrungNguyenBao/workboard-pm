import { useState } from 'react'
import { Pencil, CheckCircle2, XCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { ContractFormDialog } from '../components/contract-form-dialog'
import {
  type Contract,
  CONTRACT_STATUSES,
  BILLING_PERIODS,
  useContracts,
  useActivateContract,
  useTerminateContract,
} from '../hooks/use-contracts'
import { useAccounts } from '../../accounts/hooks/use-accounts'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, string> = {
  active: 'success',
  terminated: 'danger',
  expired: 'secondary',
  draft: 'secondary',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ContractsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editContract, setEditContract] = useState<Contract | null>(null)

  const { data, isLoading } = useContracts(workspaceId, {
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: accountsData } = useAccounts(workspaceId, { page_size: 200 })
  const activateContract = useActivateContract(workspaceId)
  const terminateContract = useTerminateContract(workspaceId)

  const accountMap = new Map((accountsData?.items ?? []).map((a) => [a.id, a.name]))

  const columns: SimpleColumn<Contract>[] = [
    { key: 'contract_number', label: 'Contract #', render: (c) => <span className="font-mono text-xs text-muted-foreground">{c.contract_number}</span> },
    { key: 'title', label: 'Title', render: (c) => <span className="font-medium">{c.title}</span> },
    { key: 'account', label: 'Account', render: (c) => accountMap.get(c.account_id) ?? '-' },
    { key: 'value', label: 'Value', render: (c) => formatCurrency(c.value) },
    {
      key: 'status',
      label: 'Status',
      render: (c) => (
        <Badge variant={(STATUS_VARIANT[c.status] ?? 'secondary') as BadgeVariant}>
          {CONTRACT_STATUSES.find((s) => s.value === c.status)?.label ?? c.status}
        </Badge>
      ),
    },
    { key: 'start_date', label: 'Start', render: (c) => formatDate(c.start_date) },
    { key: 'end_date', label: 'End', render: (c) => formatDate(c.end_date) },
    {
      key: 'billing_period',
      label: 'Billing',
      render: (c) => BILLING_PERIODS.find((b) => b.value === c.billing_period)?.label ?? c.billing_period ?? '-',
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (c) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          {c.status === 'draft' && (
            <button
              className="p-1 text-muted-foreground hover:text-emerald-600"
              title="Activate"
              onClick={async () => {
                await activateContract.mutateAsync(c.id)
                toast({ title: 'Contract activated', variant: 'success' })
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          {c.status === 'active' && (
            <button
              className="p-1 text-muted-foreground hover:text-destructive"
              title="Terminate"
              onClick={async () => {
                if (window.confirm(`Terminate "${c.title}"?`)) {
                  await terminateContract.mutateAsync(c.id)
                  toast({ title: 'Contract terminated', variant: 'success' })
                }
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="p-1 text-muted-foreground hover:text-foreground"
            onClick={() => { setEditContract(c); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Contracts"
        description="Manage customer contracts and agreements"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditContract(null); setDialogOpen(true) }}
        createLabel="New Contract"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CONTRACT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(c) => c.id}
        isLoading={isLoading}
        emptyTitle="No contracts yet"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <ContractFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        workspaceId={workspaceId}
        contract={editContract}
      />
    </div>
  )
}
