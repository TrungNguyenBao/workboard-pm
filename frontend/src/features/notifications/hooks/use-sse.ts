import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { getAccessToken } from '@/shared/lib/api'

export function useSSE() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const qc = useQueryClient()
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!activeWorkspaceId) return

    const token = getAccessToken()
    if (!token) return

    // EventSource doesn't support headers directly; use URL param approach via proxy
    const url = `/api/v1/workspaces/${activeWorkspaceId}/sse`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'notification') {
          qc.invalidateQueries({ queryKey: ['notifications'] })
        }
        if (data.type === 'task_updated' || data.type === 'task_created') {
          qc.invalidateQueries({ queryKey: ['tasks'] })
        }
      } catch {
        // ignore JSON parse errors from malformed SSE data
      }
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [activeWorkspaceId, qc])
}
