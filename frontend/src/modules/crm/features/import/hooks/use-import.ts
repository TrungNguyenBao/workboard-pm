import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface ImportJob {
  id: string
  type: string
  file_name: string
  file_url: string
  status: string
  total_rows: number
  imported_rows: number
  failed_rows: number
  error_log: Record<string, unknown> | null
  column_mapping: Record<string, string> | null
  created_by: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

const base = (wsId: string) => `/crm/workspaces/${wsId}`

export function useImportJobs(workspaceId: string) {
  return useQuery<ImportJob[]>({
    queryKey: ['crm-import-jobs', workspaceId],
    queryFn: () => api.get(`${base(workspaceId)}/import-jobs`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useImportJobDetail(workspaceId: string, jobId: string | null) {
  return useQuery<ImportJob>({
    queryKey: ['crm-import-job', workspaceId, jobId],
    queryFn: () =>
      api.get(`${base(workspaceId)}/import-jobs/${jobId}`).then((r) => r.data),
    enabled: !!workspaceId && !!jobId,
  })
}

export function useCreateImport(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      type,
      columnMapping,
    }: {
      file: File
      type: string
      columnMapping?: Record<string, string>
    }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      if (columnMapping) {
        form.append('column_mapping', JSON.stringify(columnMapping))
      }
      return api
        .post(`${base(workspaceId)}/import`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data as ImportJob)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-import-jobs', workspaceId] }),
  })
}
