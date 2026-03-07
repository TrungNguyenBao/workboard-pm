import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'

interface FunnelData {
  total_leads: number
  qualified: number
  opportunity: number
  closed_won: number
}

interface Props {
  funnel: FunnelData
}

const FUNNEL_COLORS = ['#38BDF8', '#818CF8', '#F59E0B', '#22C55E']

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
          <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} />
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
