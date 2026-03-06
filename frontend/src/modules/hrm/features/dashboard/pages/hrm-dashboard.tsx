import { Briefcase, Calendar, DollarSign, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { useHrmStats } from '../hooks/use-hrm-stats'

const BAR_COLOR = '#818CF8'

export default function HrmDashboardPage() {
  const { stats, deptBars, isLoading } = useHrmStats()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
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
    <div className="p-6 space-y-6">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="employees" radius={[4, 4, 0, 0]}>
                {deptBars.map((_, i) => (
                  <Cell key={i} fill={BAR_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
