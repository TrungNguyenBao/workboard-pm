import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { InviteMembersDialog } from '@/features/workspaces/components/invite-members-dialog'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'
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
  const { t } = useTranslation()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['workspace-members', activeWorkspaceId],
    queryFn: () =>
      api.get(`/workspaces/${activeWorkspaceId}/members`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  const isAdmin = members.find((m) => m.user_id === currentUser?.id)?.role === 'admin'

  const updateRole = useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: string }) =>
      api.patch(`/workspaces/${activeWorkspaceId}/members/${membershipId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspaceId] })
    },
  })

  const removeMember = useMutation({
    mutationFn: (membershipId: string) =>
      api.delete(`/workspaces/${activeWorkspaceId}/members/${membershipId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspaceId] })
    },
  })

  const handleRemove = (m: Member) => {
    if (window.confirm(t('members.removeConfirm', { name: m.user_name }))) {
      removeMember.mutate(m.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full pt-6 px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">
              {t('members.count', { count: members.length })}
            </p>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              {t('members.invite')}
            </Button>
          </div>

          {isLoading && (
            <p className="text-sm text-neutral-400 text-center py-10">{t('members.loading')}</p>
          )}

          {!isLoading && members.length > 0 && (
            <div className="divide-y divide-border rounded-md border border-border">
              {members.map((m) => {
                const isSelf = m.user_id === currentUser?.id
                const canManage = isAdmin && !isSelf
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={m.user_avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {generateInitials(m.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.user_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user_email}</p>
                    </div>
                    {canManage ? (
                      <>
                        <Select
                          value={m.role}
                          onValueChange={(role) => updateRole.mutate({ membershipId: m.id, role })}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('members.role.admin')}</SelectItem>
                            <SelectItem value="member">{t('members.role.member')}</SelectItem>
                            <SelectItem value="guest">{t('members.role.guest')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-neutral-400 hover:text-red-600"
                          onClick={() => handleRemove(m)}
                          title={t('members.removeMember')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant={ROLE_VARIANT[m.role] ?? 'secondary'} className="capitalize">
                        {m.role}
                      </Badge>
                    )}
                  </div>
                )
              })}
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
