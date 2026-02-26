import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { Header } from '@/features/auth/components/header'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { InviteMembersDialog } from '@/features/workspaces/components/invite-members-dialog'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { generateInitials } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

interface Member {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar_url: string | null
  role: string
}

const ROLE_VARIANT: Record<string, 'secondary' | 'warning' | 'danger'> = {
  admin: 'warning',
  member: 'secondary',
  guest: 'secondary',
}

export default function MembersPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['workspace-members', activeWorkspaceId],
    queryFn: () =>
      api.get(`/workspaces/${activeWorkspaceId}/members`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Members" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full pt-6 px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Invite
            </Button>
          </div>

          {isLoading && (
            <p className="text-sm text-neutral-400 text-center py-10">Loading…</p>
          )}

          {!isLoading && members.length > 0 && (
            <div className="divide-y divide-border rounded-md border border-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={m.user_avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {generateInitials(m.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{m.user_name}</p>
                    <p className="text-xs text-neutral-400 truncate">{m.user_email}</p>
                  </div>
                  <Badge variant={ROLE_VARIANT[m.role] ?? 'secondary'} className="capitalize">
                    {m.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeWorkspaceId && (
        <InviteMembersDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          workspaceId={activeWorkspaceId}
        />
      )}
    </div>
  )
}
