import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { VelocityPoint } from '../hooks/use-sprint-analytics'

interface Props {
  data: VelocityPoint[]
}

interface ChartPoint {
  name: string
  points: number
}

export function VelocityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No velocity data yet. Complete sprints with story points to see velocity.
      </p>
    )
  }

  // Oldest sprint on the left, cap at last 10 sprints
  const chartData: ChartPoint[] = [...data]
    .slice(0, 10)
    .reverse()
    .map((d) => ({
      name: d.sprint_name,
      points: d.completed_points,
    }))

  const avg = Math.round(
    chartData.reduce((sum, d) => sum + d.points, 0) / chartData.length,
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          Avg velocity:{' '}
          <span className="font-medium text-foreground">{avg} pts/sprint</span>
        </span>
      </div>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="points" name="Completed Points" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill="hsl(var(--primary))" fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
