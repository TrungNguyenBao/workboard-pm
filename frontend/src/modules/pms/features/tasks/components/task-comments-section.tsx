import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Pencil, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatRelativeTime } from '@/shared/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import DOMPurify from 'dompurify'
import { CommentEditor } from './comment-editor'
import api from '@/shared/lib/api'

interface Comment {
  id: string
  author_id: string
  author_name: string
  author_avatar_url: string | null
  body: string
  body_text: string | null
  created_at: string
  updated_at?: string
}

interface Props {
  projectId: string
  taskId: string
}

export function TaskCommentsSection({ projectId, taskId }: Props) {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/tasks/${taskId}/comments`).then((r) => r.data),
    enabled: !!taskId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['comments', taskId] })

  const createComment = useMutation({
    mutationFn: (body: string) =>
      api.post(`/pms/projects/${projectId}/tasks/${taskId}/comments`, {
        body,
        body_text: body.replace(/<[^>]+>/g, ''),
      }),
    onSuccess: invalidate,
  })

  const updateComment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.patch(`/pms/projects/${projectId}/tasks/${taskId}/comments/${id}`, {
        body,
        body_text: body.replace(/<[^>]+>/g, ''),
      }),
    onSuccess: () => {
      setEditingId(null)
      invalidate()
    },
  })

  const deleteComment = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/pms/projects/${projectId}/tasks/${taskId}/comments/${id}`),
    onSuccess: invalidate,
  })

  return (
    <div className="px-6 py-4">
      <p className="text-xs font-medium text-muted-foreground mb-3">
        <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </p>

      {/* Comment list */}
      <div className="space-y-4 mb-4">
        {comments.map((c) => {
          const isOwn = currentUser?.id === c.author_id
          const wasEdited =
            c.updated_at && c.updated_at !== c.created_at

          return (
            <div key={c.id} className="flex gap-2 group">
              <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {c.author_name ? c.author_name.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {c.author_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(c.created_at)}
                  </span>
                  {wasEdited && (
                    <span className="text-xs text-muted-foreground italic">edited</span>
                  )}
                </div>

                {editingId === c.id ? (
                  <CommentEditor
                    initialContent={c.body}
                    submitLabel="Save"
                    disabled={updateComment.isPending}
                    onSubmit={(html) => updateComment.mutate({ id: c.id, body: html })}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div
                    className="text-sm text-foreground prose prose-sm max-w-none [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_ul]:my-1 [&_li]:my-0"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.body) }}
                  />
                )}
              </div>

              {/* Actions — own comments only */}
              {isOwn && editingId !== c.id && (
                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* New comment */}
      <div className="flex gap-2">
        <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
          <AvatarFallback className="text-xs">
            {currentUser?.name?.slice(0, 2).toUpperCase() ?? 'Y'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CommentEditor
            placeholder="Leave a comment…"
            disabled={createComment.isPending}
            onSubmit={(html) => createComment.mutate(html)}
          />
        </div>
      </div>
    </div>
  )
}
