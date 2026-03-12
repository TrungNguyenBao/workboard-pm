import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export type ProjectRole = 'owner' | 'editor' | 'commenter' | 'viewer'

interface ProjectData {
  current_user_role: ProjectRole | null
}

interface ProjectPermissions {
  role: ProjectRole | null
  /** owner: project settings, member management, sprints, custom fields */
  canManage: boolean
  /** editor+: tasks CRUD, sections CRUD, tags, attachments */
  canEdit: boolean
  /** commenter+: add/edit/delete own comments */
  canComment: boolean
  /** viewer+: read everything */
  canView: boolean
  isOwner: boolean
  isLoading: boolean
}

const ROLE_RANK: Record<ProjectRole, number> = {
  owner: 4,
  editor: 3,
  commenter: 2,
  viewer: 1,
}

function hasMinRole(role: ProjectRole | null, min: ProjectRole): boolean {
  if (!role) return false
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

export function useProjectPermissions(projectId: string | undefined): ProjectPermissions {
  const { data, isLoading } = useQuery<ProjectData>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  const role = data?.current_user_role ?? null

  return {
    role,
    isOwner: role === 'owner',
    canManage: hasMinRole(role, 'owner'),
    canEdit: hasMinRole(role, 'editor'),
    canComment: hasMinRole(role, 'commenter'),
    canView: hasMinRole(role, 'viewer'),
    isLoading,
  }
}
