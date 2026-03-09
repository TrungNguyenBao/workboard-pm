import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { BurndownPoint } from '../hooks/use-sprint-analytics'

interface Props {
  data: BurndownPoint[]
}

interface ChartPoint {
  date: string
  remaining: number
  ideal: number
}

export function BurndownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No burndown data available. Start a sprint with tasks that have story points.
      </p>
    )
  }

  const totalPoints = data[0]?.total_points ?? 0
  const len = data.length

  const chartData: ChartPoint[] = data.map((d, i) => ({
    date: d.date.slice(5), // MM-DD compact display
    remaining: Math.max(0, totalPoints - d.completed_points),
    ideal: Math.round(totalPoints * (1 - i / Math.max(len - 1, 1))),
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Remaining"
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Ideal"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
