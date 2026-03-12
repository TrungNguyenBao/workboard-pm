import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import {
  useProjectMembers,
  useAddMember,
  useUpdateMemberRole,
  useRemoveMember,
  type MemberRole,
  type MemberResponse,
} from '../hooks/use-project-members'

const ROLES: MemberRole[] = ['owner', 'editor', 'commenter', 'viewer']

const ROLE_COLORS: Record<MemberRole, string> = {
  owner: 'default',
  editor: 'secondary',
  commenter: 'secondary',
  viewer: 'secondary',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface AddMemberRowProps {
  projectId: string
}

function AddMemberRow({ projectId }: AddMemberRowProps) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<MemberRole>('viewer')
  const addMember = useAddMember(projectId)

  function handleAdd() {
    const trimmed = userId.trim()
    if (!trimmed) return
    addMember.mutate(
      { user_id: trimmed, role },
      { onSuccess: () => setUserId('') },
    )
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border">
      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="User ID or email..."
        className="flex-1 text-sm border border-border rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/40 bg-background"
      />
      <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleAdd} disabled={!userId.trim() || addMember.isPending}>
        Add
      </Button>
    </div>
  )
}

interface MemberRowProps {
  member: MemberResponse
  isLastOwner: boolean
  projectId: string
}

function MemberRow({ member, isLastOwner, projectId }: MemberRowProps) {
  const updateRole = useUpdateMemberRole(projectId)
  const removeMember = useRemoveMember(projectId)

  function handleRemove() {
    if (!window.confirm(`Remove ${member.user_name} from this project?`)) return
    removeMember.mutate(member.user_id)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-[11px]">{initials(member.user_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.user_name}</p>
        <p className="text-xs text-muted-foreground truncate">{member.user_email}</p>
      </div>
      <Select
        value={member.role}
        onValueChange={(v) => updateRole.mutate({ userId: member.user_id, role: v as MemberRole })}
        disabled={updateRole.isPending}
      >
        <SelectTrigger className="w-28">
          <SelectValue>
            <Badge variant={ROLE_COLORS[member.role] as 'default' | 'secondary'} className="text-[10px] capitalize">
              {member.role}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon-sm"
        variant="ghost"
        title="Remove member"
        disabled={isLastOwner || removeMember.isPending}
        onClick={handleRemove}
      >
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </Button>
    </div>
  )
}

interface Props {
  projectId: string
}

export function MemberManagementPanel({ projectId }: Props) {
  const { data: members = [], isLoading } = useProjectMembers(projectId)

  const ownerCount = members.filter((m) => m.role === 'owner').length

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Loading members...</p>
  }

  return (
    <div className="space-y-1">
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No members yet.</p>
      )}
      {members.map((member) => (
        <MemberRow
          key={member.user_id}
          member={member}
          isLastOwner={member.role === 'owner' && ownerCount === 1}
          projectId={projectId}
        />
      ))}
      <AddMemberRow projectId={projectId} />
    </div>
  )
}
