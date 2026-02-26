import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckSquare, MessageSquare, Tag, User } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn, formatRelativeTime } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import type { Task } from '@/features/projects/hooks/use-project-tasks'

interface Member {
  id: string
  user_id: string
  user_name: string
  user_email: string
}

interface Comment {
  id: string
  author_id: string
  body: string
  body_text: string | null
  created_at: string
}

interface Props {
  task: Task | null
  projectId: string
  workspaceId?: string
  onClose: () => void
}

export function TaskDetailDrawer({ task, projectId, workspaceId, onClose }: Props) {
  const qc = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId && !!task,
  })

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', task?.id],
    queryFn: () =>
      api.get(`/projects/${projectId}/tasks/${task!.id}/comments`).then((r) => r.data),
    enabled: !!task,
  })

  const { data: subtasks = [] } = useQuery<Task[]>({
    queryKey: ['subtasks', task?.id],
    queryFn: () =>
      api.get(`/projects/${projectId}/tasks?include_subtasks=true`).then((r) =>
        r.data.filter((t: Task) => t.parent_id === task?.id),
      ),
    enabled: !!task,
  })

  const updateTask = useMutation({
    mutationFn: (data: Partial<Task>) =>
      api.patch(`/projects/${projectId}/tasks/${task!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })

  async function submitComment() {
    if (!newComment.trim() || !task) return
    setCommentLoading(true)
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, {
        body: newComment,
        body_text: newComment,
      })
      setNewComment('')
      qc.invalidateQueries({ queryKey: ['comments', task.id] })
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col w-[480px] p-0 overflow-hidden">
        {task && (
          <>
            <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    updateTask.mutate({
                      status: task.status === 'completed' ? 'incomplete' : 'completed',
                    })
                  }
                  className="mt-0.5 flex-shrink-0 text-neutral-300 hover:text-primary transition-colors"
                >
                  <CheckSquare className={cn('h-5 w-5', task.status === 'completed' && 'text-primary')} />
                </button>
                <SheetTitle
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.textContent?.trim()
                    if (val && val !== task.title) updateTask.mutate({ title: val })
                  }}
                  className="text-base font-semibold text-neutral-900 outline-none flex-1 cursor-text"
                >
                  {task.title}
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {/* Meta */}
              <div className="px-6 py-4 space-y-3 border-b border-border">
                {/* Priority */}
                <MetaRow icon={<Tag className="h-4 w-4" />} label="Priority">
                  <Select
                    value={task.priority}
                    onValueChange={(v) => updateTask.mutate({ priority: v })}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs border-0 bg-neutral-100 hover:bg-neutral-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['none', 'low', 'medium', 'high'].map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MetaRow>

                {/* Assignee */}
                {members.length > 0 && (
                  <MetaRow icon={<User className="h-4 w-4" />} label="Assignee">
                    <Select
                      value={task.assignee_id ?? 'none'}
                      onValueChange={(v) =>
                        updateTask.mutate({ assignee_id: v === 'none' ? null : v })
                      }
                    >
                      <SelectTrigger className="h-7 w-36 text-xs border-0 bg-neutral-100 hover:bg-neutral-200">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.user_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </MetaRow>
                )}

                {/* Due date */}
                <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Due date">
                  <input
                    type="date"
                    defaultValue={task.due_date ? task.due_date.slice(0, 10) : ''}
                    onChange={(e) =>
                      updateTask.mutate({ due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                    }
                    className="text-xs text-neutral-700 bg-neutral-100 rounded px-2 py-1 border-0 outline-none"
                  />
                </MetaRow>
              </div>

              {/* Description */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-neutral-500 mb-2">Description</p>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.textContent?.trim() || null
                    updateTask.mutate({ description: val })
                  }}
                  className="text-sm text-neutral-700 outline-none min-h-[60px] cursor-text empty:before:content-['Add_description…'] empty:before:text-neutral-300"
                >
                  {task.description}
                </div>
              </div>

              {/* Subtasks */}
              {subtasks.length > 0 && (
                <div className="px-6 py-4 border-b border-border">
                  <p className="text-xs font-medium text-neutral-500 mb-2">Subtasks ({subtasks.length})</p>
                  <div className="space-y-1">
                    {subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <CheckSquare className={cn('h-3.5 w-3.5 flex-shrink-0', sub.status === 'completed' ? 'text-primary' : 'text-neutral-300')} />
                        <span className={cn('text-sm', sub.status === 'completed' && 'line-through text-neutral-400')}>{sub.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="px-6 py-4">
                <p className="text-xs font-medium text-neutral-500 mb-3">
                  <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
                  Activity ({comments.length})
                </p>
                <div className="space-y-3 mb-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="text-xs">U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800">{c.body_text ?? c.body}</p>
                        <span className="text-xs text-neutral-400">{formatRelativeTime(c.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Comment input */}
                <div className="flex gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="text-xs">Y</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Leave a comment…"
                      rows={2}
                      className="w-full resize-none rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          submitComment()
                        }
                      }}
                    />
                    {newComment.trim() && (
                      <Button size="sm" className="mt-1.5" onClick={submitComment} disabled={commentLoading}>
                        {commentLoading ? 'Posting…' : 'Post'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-24 text-xs text-neutral-500">
        {icon}
        {label}
      </div>
      {children}
    </div>
  )
}
