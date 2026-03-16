import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { InsuranceFormDialog } from '../components/insurance-form-dialog'
import { type InsuranceRecord, useInsurance, useDeleteInsurance } from '../hooks/use-insurance'

const TYPE_VARIANT: Record<string, string> = {
  bhxh: 'info',
  bhyt: 'info',
  bhtn: 'secondary',
}

const TYPE_LABELS: Record<string, string> = {
  bhxh: 'BHXH',
  bhyt: 'BHYT',
  bhtn: 'BHTN',
}

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatRate(rate: number) {
  return `${(rate * 100).toFixed(2)}%`
}

export default function InsuranceListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<InsuranceRecord | null>(null)

  const { data: records = [] } = useInsurance(workspaceId)
  const deleteRecord = useDeleteInsurance(workspaceId)

  const columns: SimpleColumn<InsuranceRecord>[] = [
    { key: 'employee_id', label: 'Employee ID', render: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{r.employee_id.slice(0, 8)}…</span>
    )},
    { key: 'insurance_type', label: 'Type', render: (r) => (
      <Badge variant={(TYPE_VARIANT[r.insurance_type] ?? 'secondary') as BadgeVariant}>
        {TYPE_LABELS[r.insurance_type] ?? r.insurance_type.toUpperCase()}
      </Badge>
    )},
    { key: 'base_salary', label: 'Base Salary', render: (r) => formatVND(Number(r.base_salary)) },
    { key: 'employee_rate', label: 'Employee %', render: (r) => formatRate(Number(r.employee_rate)) },
    { key: 'employer_rate', label: 'Employer %', render: (r) => formatRate(Number(r.employer_rate)) },
    { key: 'effective_from', label: 'From', render: (r) => r.effective_from },
    { key: 'effective_to', label: 'To', render: (r) => r.effective_to ?? <span className="text-muted-foreground italic">Active</span> },
    { key: 'actions', label: '', className: 'w-20', render: (r) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditRecord(r); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
          if (window.confirm('Delete this insurance record?')) {
            await deleteRecord.mutateAsync(r.id)
            toast({ title: 'Insurance record deleted', variant: 'success' })
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
        title="Insurance Records"
        description="Manage employee social and health insurance"
        onCreateClick={() => { setEditRecord(null); setDialogOpen(true) }}
        createLabel="New Record"
      />
      <DataTable
        columns={toColumnDefs(columns)}
        data={records}
        keyFn={(r) => r.id}
        emptyTitle="No insurance records found."
      />
      <InsuranceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        record={editRecord}
      />
    </div>
  )
}
