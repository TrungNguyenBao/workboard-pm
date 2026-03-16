import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useEmployeeDetail } from '../hooks/use-employees'
import { useLeaveRequests } from '../../leave/hooks/use-leave'
import { EmployeeContractsTab } from '../components/employee-contracts-tab'
import { EmployeeSalaryTab } from '../components/employee-salary-tab'
import { EmployeeFormDialog } from '../components/employee-form-dialog'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import type { LeaveRequest } from '../../leave/hooks/use-leave'

const TABS = ['Info', 'Contracts', 'Salary History', 'Leave'] as const
type Tab = typeof TABS[number]

export default function EmployeeDetailPage() {
  const { employeeId = '' } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [activeTab, setActiveTab] = useState<Tab>('Info')
  const [editOpen, setEditOpen] = useState(false)

  const { data: employee, isLoading } = useEmployeeDetail(workspaceId, employeeId)
  const { data: leaveData } = useLeaveRequests(workspaceId, { employee_id: employeeId, page_size: 50 })

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }
  if (!employee) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Employee not found</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          onClick={() => navigate('/hrm/employees')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Employees
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{employee.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {employee.position && <span>{employee.position}</span>}
              {employee.hire_date && (
                <span>· Hired {new Date(employee.hire_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>
        </div>
      </div>

      <div className="border-b border-border px-4 sm:px-6 overflow-x-auto">
        <nav className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {activeTab === 'Info' && <InfoTab employee={employee} />}
        {activeTab === 'Contracts' && <EmployeeContractsTab workspaceId={workspaceId} employeeId={employeeId} />}
        {activeTab === 'Salary History' && <EmployeeSalaryTab workspaceId={workspaceId} employeeId={employeeId} />}
        {activeTab === 'Leave' && <LeaveTab items={leaveData?.items ?? []} />}
      </div>

      <EmployeeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        workspaceId={workspaceId}
        employee={employee}
      />
    </div>
  )
}

function InfoTab({ employee }: { employee: ReturnType<typeof useEmployeeDetail>['data'] }) {
  if (!employee) return null
  const fields: { label: string; value: string | null | undefined }[] = [
    { label: 'Name', value: employee.name },
    { label: 'Email', value: employee.email },
    { label: 'Position', value: employee.position },
    { label: 'Hire Date', value: employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : null },
  ]
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-lg border border-border divide-y divide-border">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex px-4 py-3">
            <span className="w-32 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm text-foreground">{value ?? '—'}</span>
          </div>
        ))}
      </div>
      {Object.keys(employee.leave_balance).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Leave Balance</h3>
          <div className="rounded-lg border border-border divide-y divide-border">
            {Object.entries(employee.leave_balance).map(([type, bal]) => (
              <div key={type} className="flex items-center px-4 py-2.5 text-sm">
                <span className="flex-1 text-foreground">{type}</span>
                <span className="text-muted-foreground">{bal.used} / {bal.total} used</span>
                <span className="ml-4 font-medium text-foreground">{bal.remaining} remaining</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LEAVE_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
}

function LeaveTab({ items }: { items: LeaveRequest[] }) {
  const columns: SimpleColumn<LeaveRequest>[] = [
    { key: 'start_date', label: 'Start', render: (r) => r.start_date },
    { key: 'end_date', label: 'End', render: (r) => r.end_date },
    { key: 'days', label: 'Days', render: (r) => r.days },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', LEAVE_STATUS_CLASSES[r.status] ?? '')}>
        {r.status}
      </span>
    )},
  ]
  return (
    <DataTable
      columns={toColumnDefs(columns)}
      data={items}
      keyFn={(r) => r.id}
      emptyTitle="No leave requests"
    />
  )
}
