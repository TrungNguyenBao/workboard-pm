import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { type SalaryHistory, useSalaryHistory } from '../hooks/use-salary-history'

interface Props {
  workspaceId: string
  employeeId: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount)
}

function formatChange(prev: number, next: number): React.ReactNode {
  const diff = next - prev
  const sign = diff >= 0 ? '+' : ''
  const cls = diff >= 0 ? 'text-green-600' : 'text-red-600'
  return <span className={cls}>{sign}{formatCurrency(diff)}</span>
}

export function EmployeeSalaryTab({ workspaceId, employeeId }: Props) {
  const { data } = useSalaryHistory(workspaceId, employeeId)

  const columns = [
    {
      key: 'effective_date',
      label: 'Effective Date',
      render: (r: SalaryHistory) => r.effective_date,
    },
    {
      key: 'previous_amount',
      label: 'Previous',
      render: (r: SalaryHistory) => formatCurrency(r.previous_amount),
    },
    {
      key: 'new_amount',
      label: 'New',
      render: (r: SalaryHistory) => formatCurrency(r.new_amount),
    },
    {
      key: 'change',
      label: 'Change',
      render: (r: SalaryHistory) => formatChange(r.previous_amount, r.new_amount),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (r: SalaryHistory) => r.reason,
    },
  ]

  return (
    <HrmDataTable
      columns={columns}
      data={data?.items ?? []}
      keyFn={(r) => r.id}
      emptyMessage="No salary history"
    />
  )
}
