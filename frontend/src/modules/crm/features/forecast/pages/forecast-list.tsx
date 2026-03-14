import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useForecasts, useCloseForecast } from '../hooks/use-forecasts'
import { ForecastTable } from '../components/forecast-table'

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function ForecastListPage() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [period, setPeriod] = useState(currentPeriod())

  const { data: forecasts = [], isLoading } = useForecasts(wsId, period)
  const closeMutation = useCloseForecast(wsId)

  function handleClose(id: string) {
    if (confirm('Mark this forecast as closed?')) {
      closeMutation.mutate(id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Sales Forecasts</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Period</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm bg-background text-foreground"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-card">
          <ForecastTable forecasts={forecasts} onClose={handleClose} />
        </div>
      )}
    </div>
  )
}
