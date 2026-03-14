import { useQuery } from '@tanstack/react-query'
import { Monitor, AlertCircle } from 'lucide-react'
import api from '@/shared/lib/api'

interface Device {
  id: string
  name: string
  serial_number?: string
  status?: string
}

interface Props {
  workspaceId: string
  accountId: string
}

export function AccountDevicesTab({ workspaceId, accountId }: Props) {
  const { data, isLoading, isError } = useQuery<Device[]>({
    queryKey: ['wms-devices', workspaceId, { account_id: accountId }],
    queryFn: () =>
      api
        .get(`/wms/workspaces/${workspaceId}/devices`, { params: { account_id: accountId } })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data?.items ?? [])),
    enabled: !!workspaceId && !!accountId,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        WMS module unavailable or no device data found.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <Monitor className="h-8 w-8" />
        <p className="text-sm">No devices linked to this account</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
        >
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{device.name}</p>
              {device.serial_number && (
                <p className="text-xs text-muted-foreground">S/N: {device.serial_number}</p>
              )}
            </div>
          </div>
          {device.status && (
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {device.status}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
