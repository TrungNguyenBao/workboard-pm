import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

export interface DataQualityReport {
  duplicate_email_count: number
  duplicate_phone_count: number
  incomplete_leads: number
  stale_contacts_90d: number
  ownerless_deals: number
  /** Derived fields computed by hook */
  quality_score: number
  duplicate_count: number
  missing_fields_count: number
  stale_records_count: number
}

function computeScore(report: Omit<DataQualityReport, 'quality_score' | 'duplicate_count' | 'missing_fields_count' | 'stale_records_count'>): number {
  const issues = report.duplicate_email_count + report.duplicate_phone_count
    + report.incomplete_leads + report.stale_contacts_90d + report.ownerless_deals
  // Score degrades by 2 per issue, min 0
  return Math.max(0, Math.min(100, Math.round(100 - issues * 2)))
}

export function useDataQuality(workspaceId: string) {
  return useQuery<DataQualityReport>({
    queryKey: ['crm-data-quality', workspaceId],
    queryFn: async () => {
      const raw = await api
        .get(`/crm/workspaces/${workspaceId}/data-quality/report`)
        .then((r) => r.data)
      return {
        ...raw,
        quality_score: computeScore(raw),
        duplicate_count: raw.duplicate_email_count + raw.duplicate_phone_count,
        missing_fields_count: raw.incomplete_leads + raw.ownerless_deals,
        stale_records_count: raw.stale_contacts_90d,
      }
    },
    enabled: !!workspaceId,
    retry: false,
  })
}

export function useDataQualityAuto() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useDataQuality(wsId)
}
