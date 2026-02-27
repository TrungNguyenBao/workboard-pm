import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckSquare, History, MessageSquare, Paperclip, Plus, Repeat, Tag, Trash2, Upload, User, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn, formatRelativeTime } from '@/shared/lib/utils'
import { TaskActivity } from './task-activity'
import { RecurrencePicker } from './recurrence-picker'
import { CustomFieldsSection } from '@/features/custom-fields/components/custom-fields-section'
import api from '@/shared/lib/api'
import type { Task } from '@/features/projects/hooks/use-project-tasks'

interface Member {
  id: string
  user_id: string
  user_name: string
  user_email: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

interface Comment {
  id: string
  author_id: string
  author_name: string
  author_avatar_url: string | null
  body: string
  body_text: string | null
  created_at: string
}

interface Attachment {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
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
  const [newSubtask, setNewSubtask] = useState('')
  const subtaskRef = useRef<HTMLInputElement>(null)

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

  const { data: workspaceTags = [] } = useQuery<TagItem[]>({
    queryKey: ['workspace-tags', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/tags`).then((r) => r.data),
    enabled: !!workspaceId && !!task,
  })

  const { data: taskTags = [] } = useQuery<TagItem[]>({
    queryKey: ['task-tags', task?.id],
    queryFn: () => api.get(`/projects/${projectId}/tasks/${task!.id}/tags`).then((r) => r.data),
    enabled: !!task,
  })

  const updateTask = useMutation({
    mutationFn: (data: Partial<Task>) =>
      api.patch(`/projects/${projectId}/tasks/${task!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}/tasks/${task!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      onClose()
    },
  })

  const createSubtask = useMutation({
    mutationFn: (title: string) =>
      api.post(`/projects/${projectId}/tasks`, {
        title,
        parent_id: task!.id,
        section_id: task!.section_id,
        priority: 'none',
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtasks', task!.id] })
      setNewSubtask('')
    },
  })

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      api.delete(`/projects/${projectId}/tasks/${task!.id}/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', task!.id] }),
  })

  const toggleTag = useMutation({
    mutationFn: ({ tagId, active }: { tagId: string; active: boolean }) =>
      active
        ? api.delete(`/projects/${projectId}/tasks/${task!.id}/tags/${tagId}`)
        : api.post(`/projects/${projectId}/tasks/${task!.id}/tags/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-tags', task!.id] }),
  })

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', task?.id],
    queryFn: () =>
      api.get(`/projects/${projectId}/tasks/${task!.id}/attachments`).then((r) => r.data),
    enabled: !!task,
  })

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete(`/projects/${projectId}/tasks/${task!.id}/attachments/${attachmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', task!.id] }),
  })

  async function uploadAttachment(file: File) {
    if (!task) return
    const form = new FormData()
    form.append('file', file)
    await api.post(`/projects/${projectId}/tasks/${task.id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    qc.invalidateQueries({ queryKey: ['attachments', task.id] })
  }

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
                {!(task.recurrence_rule && !task.parent_recurring_id) && (
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
                )}
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
                <button
                  onClick={() => {
                    if (window.confirm('Delete this task?')) deleteTask.mutate()
                  }}
                  className="mt-0.5 flex-shrink-0 text-neutral-300 hover:text-red-500 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
                    className={cn(
                      'text-xs bg-neutral-100 rounded px-2 py-1 border-0 outline-none',
                      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                        ? 'text-red-500 font-medium'
                        : 'text-neutral-700',
                    )}
                  />
                </MetaRow>
                {/* Recurrence */}
                <MetaRow icon={<Repeat className="h-4 w-4" />} label="Repeat">
                  <RecurrencePicker
                    rule={task.recurrence_rule}
                    cronExpr={task.recurrence_cron_expr}
                    endDate={task.recurrence_end_date}
                    onChange={(data) => updateTask.mutate(data)}
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

              {/* Tags */}
              {workspaceTags.length > 0 && (
                <div className="px-6 py-4 border-b border-border">
                  <p className="text-xs font-medium text-neutral-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {workspaceTags.map((tag) => {
                      const active = taskTags.some((t) => t.id === tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag.mutate({ tagId: tag.id, active })}
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity',
                            active ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-40 hover:opacity-70',
                          )}
                          style={{ backgroundColor: tag.color + '22', color: tag.color, ringColor: tag.color }}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              <CustomFieldsSection
                projectId={projectId}
                taskId={task.id}
                customFields={task.custom_fields}
                onUpdate={(fields) => updateTask.mutate({ custom_fields: fields })}
              />

              {/* Attachments */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-neutral-500">
                    <Paperclip className="h-3.5 w-3.5 inline mr-1" />
                    Attachments {attachments.length > 0 && `(${attachments.length})`}
                  </p>
                  <label className="cursor-pointer text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadAttachment(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 py-1 group">
                        <Paperclip className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                        <a
                          href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/projects/${projectId}/tasks/${task!.id}/attachments/${a.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs text-primary hover:underline truncate"
                        >
                          {a.filename}
                        </a>
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {(a.size_bytes / 1024).toFixed(0)}KB
                        </span>
                        <button
                          onClick={() => deleteAttachment.mutate(a.id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtasks */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-neutral-500 mb-2">
                  Subtasks {subtasks.length > 0 && `(${subtasks.length})`}
                </p>
                <div className="space-y-1 mb-2">
                  {subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <CheckSquare className={cn('h-3.5 w-3.5 flex-shrink-0', sub.status === 'completed' ? 'text-primary' : 'text-neutral-300')} />
                      <span className={cn('text-sm', sub.status === 'completed' && 'line-through text-neutral-400')}>{sub.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={subtaskRef}
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtask.trim()) createSubtask.mutate(newSubtask.trim())
                      if (e.key === 'Escape') setNewSubtask('')
                    }}
                    placeholder="Add subtask…"
                    className="flex-1 text-sm bg-neutral-50 border border-border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {newSubtask.trim() && (
                    <button
                      onClick={() => createSubtask.mutate(newSubtask.trim())}
                      className="p-1 text-primary hover:text-primary/80"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Activity log */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-neutral-500 mb-2">
                  <History className="h-3.5 w-3.5 inline mr-1" />
                  History
                </p>
                <TaskActivity taskId={task.id} projectId={projectId} />
              </div>

              {/* Comments */}
              <div className="px-6 py-4">
                <p className="text-xs font-medium text-neutral-500 mb-3">
                  <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
                  Activity ({comments.length})
                </p>
                <div className="space-y-3 mb-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2 group">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {c.author_name ? c.author_name.slice(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-neutral-700">{c.author_name}</span>
                          <span className="text-xs text-neutral-400">{formatRelativeTime(c.created_at)}</span>
                        </div>
                        <p className="text-sm text-neutral-800">{c.body_text ?? c.body}</p>
                      </div>
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-neutral-300 hover:text-red-500 transition-all"
                        title="Delete comment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
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
