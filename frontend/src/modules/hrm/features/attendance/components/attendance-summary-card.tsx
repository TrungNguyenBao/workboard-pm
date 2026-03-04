import type { AttendanceSummary } from '../hooks/use-attendance'

interface Props {
  summaries: AttendanceSummary[]
  period: string
}

export function AttendanceSummaryCard({ summaries, period }: Props) {
  if (summaries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground px-1 py-3">
        No attendance data for {period}.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">Employee</th>
            <th className="px-3 py-2 text-center font-medium">Present</th>
            <th className="px-3 py-2 text-center font-medium">Absent</th>
            <th className="px-3 py-2 text-center font-medium">Late</th>
            <th className="px-3 py-2 text-center font-medium">Half Day</th>
            <th className="px-3 py-2 text-center font-medium">Leave</th>
            <th className="px-3 py-2 text-center font-medium">Total Hrs</th>
            <th className="px-3 py-2 text-center font-medium">Overtime</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.employee_id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2 font-medium">{s.employee_name}</td>
              <td className="px-3 py-2 text-center text-green-700">{s.present_days}</td>
              <td className="px-3 py-2 text-center text-red-600">{s.absent_days}</td>
              <td className="px-3 py-2 text-center text-amber-600">{s.late_days}</td>
              <td className="px-3 py-2 text-center text-blue-600">{s.half_day_count}</td>
              <td className="px-3 py-2 text-center text-purple-600">{s.leave_count}</td>
              <td className="px-3 py-2 text-center">{Number(s.total_hours).toFixed(1)}</td>
              <td className="px-3 py-2 text-center text-orange-600">{Number(s.overtime_hours).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
