import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { PayrollFormDialog } from '../components/payroll-form-dialog'
import { type PayrollRecord, usePayrollRecords, useDeletePayrollRecord } from '../hooks/use-payroll'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, string> = {
  draft: 'secondary',
  approved: 'info',
  paid: 'success',
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

  const { data, isLoading } = usePayrollRecords(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteRecord = useDeletePayrollRecord(workspaceId)

  const columns: SimpleColumn<PayrollRecord>[] = [
    { key: 'period', label: 'Period', render: (r) => <span className="font-medium">{r.period}</span> },
    { key: 'gross', label: 'Gross', render: (r) => formatCurrency(r.gross) },
    { key: 'net', label: 'Net', render: (r) => formatCurrency(r.net) },
    {
      key: 'status',
      label: t('common:common.status'),
      render: (r) => (
        <Badge variant={(STATUS_VARIANT[r.status] ?? 'secondary') as any}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-muted-foreground hover:text-foreground"
            onClick={() => { setEditRecord(r); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-muted-foreground hover:text-destructive"
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
      <PageHeader
        title={t('payroll.title')}
        description={t('payroll.description')}
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
      </PageHeader>
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(r) => r.id}
        isLoading={isLoading}
        emptyTitle={t('payroll.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <PayrollFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        record={editRecord}
      />
    </div>
  )
}
