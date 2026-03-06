import { useWorkspaceStore } from '@/stores/workspace.store'
import { useEmployees } from '@/modules/hrm/features/employees/hooks/use-employees'
import { useDepartments } from '@/modules/hrm/features/departments/hooks/use-departments'
import { useLeaveRequests } from '@/modules/hrm/features/leave/hooks/use-leave'
import { usePayrollRecords } from '@/modules/hrm/features/payroll/hooks/use-payroll'

interface HrmStats {
  totalEmployees: number
  totalDepartments: number
  pendingLeave: number
  payrollThisMonth: number
}

interface DeptBar { name: string; employees: number }

export function useHrmStats() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const wsId = activeWorkspaceId ?? ''

  const employeesQuery = useEmployees(wsId, { page_size: 200 })
  const departmentsQuery = useDepartments(wsId, { page_size: 100 })
  const leaveQuery = useLeaveRequests(wsId, { status: 'pending', page_size: 1 })
  const payrollQuery = usePayrollRecords(wsId, { page_size: 1 })

  const employees = employeesQuery.data?.items ?? []
  const departments = departmentsQuery.data?.items ?? []

  // employees per department bar data
  const deptMap = new Map(departments.map((d) => [d.id, d.name]))
  const deptCounts: Record<string, number> = {}
  for (const emp of employees) {
    if (emp.department_id) {
      const name = deptMap.get(emp.department_id) ?? 'Unknown'
      deptCounts[name] = (deptCounts[name] ?? 0) + 1
    }
  }
  const deptBars: DeptBar[] = Object.entries(deptCounts).map(([name, employees]) => ({ name, employees }))

  const stats: HrmStats = {
    totalEmployees: employeesQuery.data?.total ?? 0,
    totalDepartments: departmentsQuery.data?.total ?? 0,
    pendingLeave: leaveQuery.data?.total ?? 0,
    payrollThisMonth: payrollQuery.data?.total ?? 0,
  }

  const isLoading =
    employeesQuery.isLoading ||
    departmentsQuery.isLoading ||
    leaveQuery.isLoading ||
    payrollQuery.isLoading

  return { stats, deptBars, isLoading }
}
