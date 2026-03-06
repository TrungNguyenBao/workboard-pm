import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { type Contract, useContracts, useDeleteContract } from '../hooks/use-contracts'
import { ContractFormDialog } from './contract-form-dialog'

interface Props {
  workspaceId: string
  employeeId: string
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount)
}

export function EmployeeContractsTab({ workspaceId, employeeId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editContract, setEditContract] = useState<Contract | null>(null)

  const { data, isLoading } = useContracts(workspaceId, { employee_id: employeeId, page_size: 50 })
  const deleteContract = useDeleteContract(workspaceId)

  const columns: SimpleColumn<Contract>[] = [
    { key: 'type', label: 'Type', render: (c) => <span className="capitalize">{c.contract_type.replace('_', ' ')}</span> },
    { key: 'start_date', label: 'Start Date', render: (c) => c.start_date },
    { key: 'end_date', label: 'End Date', render: (c) => c.end_date ?? '—' },
    { key: 'base_salary', label: 'Base Salary', render: (c) => formatCurrency(c.base_salary) },
    { key: 'status', label: 'Status', render: (c) => (
      <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', STATUS_CLASSES[c.status] ?? '')}>
        {c.status}
      </span>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (c) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700"
          onClick={() => { setEditContract(c); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm('Delete this contract?')) {
            await deleteContract.mutateAsync(c.id)
            toast({ title: 'Contract deleted', variant: 'success' })
          }
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditContract(null); setDialogOpen(true) }}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Contract
        </Button>
      </div>
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(c) => c.id}
        isLoading={isLoading}
        emptyTitle="No contracts yet"
      />
      <ContractFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        employeeId={employeeId}
        contract={editContract}
      />
    </div>
  )
}
