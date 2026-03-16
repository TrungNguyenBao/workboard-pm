import { Briefcase, Calendar, DollarSign, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE } from '@/shared/lib/chart-colors'
import { useHrmStats } from '../hooks/use-hrm-stats'

export default function HrmDashboardPage() {
  const { stats, deptBars, isLoading } = useHrmStats()

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Employees" value={stats.totalEmployees} icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Departments" value={stats.totalDepartments} icon={<Briefcase className="h-5 w-5" />} />
        <KpiCard label="Pending Leave" value={stats.pendingLeave} icon={<Calendar className="h-5 w-5" />} />
        <KpiCard label="Payroll Records" value={stats.payrollThisMonth} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      {deptBars.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-4">Employees by Department</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptBars} barSize={36}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="name" tick={{ ...CHART_AXIS_STYLE, fontSize: 11 }} />
              <YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="employees" radius={[4, 4, 0, 0]}>
                {deptBars.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
