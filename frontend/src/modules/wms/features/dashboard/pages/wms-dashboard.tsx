import { Box, Package, Truck, Warehouse } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE } from '@/shared/lib/chart-colors'
import { useWmsStats } from '../hooks/use-wms-stats'

export default function WmsDashboardPage() {
  const { stats, topInventoryItems, isLoading } = useWmsStats()

  const chartData = topInventoryItems.map((item) => ({
    name: item.product_name ?? item.name,
    qty: item.quantity,
  }))

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
        <KpiCard label="Products" value={stats.totalProducts} icon={<Package className="h-5 w-5" />} />
        <KpiCard label="Warehouses" value={stats.totalWarehouses} icon={<Warehouse className="h-5 w-5" />} />
        <KpiCard label="Inventory Items" value={stats.totalInventoryItems} icon={<Box className="h-5 w-5" />} />
        <KpiCard label="Suppliers" value={stats.totalSuppliers} icon={<Truck className="h-5 w-5" />} />
      </div>

      {chartData.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-4">Top Inventory by Quantity</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={36}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="name" tick={{ ...CHART_AXIS_STYLE, fontSize: 11 }} />
              <YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.info} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
