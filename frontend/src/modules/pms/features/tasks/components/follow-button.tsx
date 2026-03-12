import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/shared/lib/api'

interface Follower {
  user_id: string
  user_name: string
  user_email: string
}

interface FollowButtonProps {
  projectId: string
  taskId: string
}

export function FollowButton({ projectId, taskId }: FollowButtonProps) {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const queryKey = ['task-followers', taskId]
  const endpoint = `/pms/projects/${projectId}/tasks/${taskId}/followers`

  const { data: followers = [] } = useQuery<Follower[]>({
    queryKey,
    queryFn: () => api.get(endpoint).then((r) => r.data),
    enabled: !!taskId,
  })

  const isFollowing = followers.some((f) => f.user_id === currentUser?.id)

  const follow = useMutation({
    mutationFn: () => api.post(endpoint),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<Follower[]>(queryKey) ?? []
      if (currentUser) {
        qc.setQueryData<Follower[]>(queryKey, [
          ...prev,
          { user_id: currentUser.id, user_name: currentUser.name ?? '', user_email: currentUser.email ?? '' },
        ])
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  })

  const unfollow = useMutation({
    mutationFn: () => api.delete(endpoint),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<Follower[]>(queryKey) ?? []
      qc.setQueryData<Follower[]>(queryKey, prev.filter((f) => f.user_id !== currentUser?.id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  })

  function toggle() {
    if (isFollowing) unfollow.mutate()
    else follow.mutate()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-7 gap-1.5 text-xs"
      title={isFollowing ? 'Unfollow task' : 'Follow task'}
    >
      {isFollowing ? (
        <BellOff className="h-3.5 w-3.5" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
      {followers.length > 0 && (
        <span className="text-muted-foreground">({followers.length})</span>
      )}
    </Button>
  )
}
