import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE } from '@/shared/lib/chart-colors'

interface FunnelData {
  total_leads: number
  qualified: number
  opportunity: number
  closed_won: number
}

interface Props {
  funnel: FunnelData
}

const FUNNEL_COLORS = [CHART_COLORS.info, CHART_COLORS.primaryLight, CHART_COLORS.warning, CHART_COLORS.success]

export function SalesFunnelChart({ funnel }: Props) {
  const data = [
    { name: 'Leads', value: funnel.total_leads },
    { name: 'Qualified', value: funnel.qualified },
    { name: 'Opportunity', value: funnel.opportunity },
    { name: 'Won', value: funnel.closed_won },
  ]

  const hasData = data.some((d) => d.value > 0)
  if (!hasData) {
    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium text-foreground mb-4">Sales Funnel</p>
        <p className="text-sm text-muted-foreground text-center py-12">No funnel data yet</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <p className="text-sm font-medium text-foreground mb-4">Sales Funnel</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barSize={24}>
          <CartesianGrid {...CHART_GRID_STYLE} vertical={true} horizontal={false} />
          <XAxis type="number" tick={CHART_AXIS_STYLE} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={CHART_AXIS_STYLE} width={80} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={FUNNEL_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
