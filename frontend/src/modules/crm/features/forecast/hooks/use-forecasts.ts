import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface SalesForecast {
  id: string
  owner_id: string
  period: string
  target_amount: number
  committed_amount: number
  best_case_amount: number
  closed_amount: number
  status: string
  workspace_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ForecastVsActual {
  period: string
  target: number
  actual: number
  attainment_pct: number
  gap: number
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/forecasts`

export function useForecasts(workspaceId: string, period?: string, ownerId?: string) {
  return useQuery<SalesForecast[]>({
    queryKey: ['crm-forecasts', workspaceId, { period, ownerId }],
    queryFn: () =>
      api
        .get(base(workspaceId), { params: { period, owner_id: ownerId } })
        .then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateForecast(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { owner_id: string; period: string; target_amount: number }) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-forecasts', workspaceId] }),
  })
}

export function useUpdateForecast(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      forecastId,
      ...data
    }: {
      forecastId: string
      target_amount?: number
      committed_amount?: number
      best_case_amount?: number
    }) => api.patch(`${base(workspaceId)}/${forecastId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-forecasts', workspaceId] }),
  })
}

export function useCloseForecast(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (forecastId: string) =>
      api.post(`${base(workspaceId)}/${forecastId}/close`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-forecasts', workspaceId] }),
  })
}

export function useForecastVsActual(workspaceId: string, forecastId: string | null) {
  return useQuery<ForecastVsActual>({
    queryKey: ['crm-forecast-vs-actual', workspaceId, forecastId],
    queryFn: () =>
      api.get(`${base(workspaceId)}/${forecastId}/vs-actual`).then((r) => r.data),
    enabled: !!workspaceId && !!forecastId,
  })
}
