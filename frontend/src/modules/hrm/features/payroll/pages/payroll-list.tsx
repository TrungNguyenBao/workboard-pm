import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { PayrollFormDialog } from '../components/payroll-form-dialog'
import { type PayrollRecord, usePayrollRecords, useDeletePayrollRecord } from '../hooks/use-payroll'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function PayrollListPage() {
  const { t } = useTranslation('hrm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null)

  const { data } = usePayrollRecords(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteRecord = useDeletePayrollRecord(workspaceId)

  const columns = [
    { key: 'period', label: 'Period', render: (r: PayrollRecord) => <span className="font-medium">{r.period}</span> },
    { key: 'gross', label: 'Gross', render: (r: PayrollRecord) => formatCurrency(r.gross) },
    { key: 'net', label: 'Net', render: (r: PayrollRecord) => formatCurrency(r.net) },
    {
      key: 'status',
      label: t('common:common.status'),
      render: (r: PayrollRecord) => (
        <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (r: PayrollRecord) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditRecord(r); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm('Delete this payroll record?')) {
                await deleteRecord.mutateAsync(r.id)
                toast({ title: 'Payroll record deleted', variant: 'success' })
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
      <HrmPageHeader
        title={t('payroll.title')}
        description={t('payroll.description')}
        searchValue=""
        onSearchChange={() => {}}
        onCreateClick={() => { setEditRecord(null); setDialogOpen(true) }}
        createLabel={t('payroll.new')}
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </HrmPageHeader>
      <HrmDataTable
        columns={columns}
        data={data?.items ?? []}
        keyFn={(r) => r.id}
        emptyMessage={t('payroll.empty')}
      />
      <HrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <PayrollFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        record={editRecord}
      />
    </div>
  )
}
