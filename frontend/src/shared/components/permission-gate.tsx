import { useParams } from 'react-router-dom'
import { useProjectPermissions } from '@/modules/pms/features/projects/hooks/use-project-permissions'

type Permission = 'manage' | 'edit' | 'comment' | 'view'

interface PermissionGateProps {
  permission: Permission
  projectId?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

function checkPermission(permission: Permission, permissions: ReturnType<typeof useProjectPermissions>): boolean {
  switch (permission) {
    case 'manage': return permissions.canManage
    case 'edit':   return permissions.canEdit
    case 'comment': return permissions.canComment
    case 'view':   return permissions.canView
    default:       return false
  }
}

/**
 * Renders children only when the current user has the required permission
 * for the given project. Falls back to `fallback` (default: null) otherwise.
 */
export function PermissionGate({ permission, projectId, fallback = null, children }: PermissionGateProps) {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>()
  const resolvedProjectId = projectId ?? routeProjectId ?? ''
  const permissions = useProjectPermissions(resolvedProjectId || undefined)

  if (permissions.isLoading) return null
  if (!checkPermission(permission, permissions)) return <>{fallback}</>
  return <>{children}</>
}

/**
 * Hook for programmatic permission checks within a project context.
 * Uses the projectId from route params if not provided.
 */
export function useCanPerform(permission: Permission, projectId?: string): boolean {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>()
  const resolvedProjectId = projectId ?? routeProjectId ?? ''
  const permissions = useProjectPermissions(resolvedProjectId || undefined)
  return checkPermission(permission, permissions)
}
