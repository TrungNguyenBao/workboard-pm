import { Box, Package, Truck, Warehouse } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { KpiCard } from '@/shared/components/ui/kpi-card'
import { useWmsStats } from '../hooks/use-wms-stats'

const BAR_COLOR = '#38BDF8'

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
              <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
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
