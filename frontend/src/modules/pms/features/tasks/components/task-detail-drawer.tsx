import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckSquare, Hash, History, Layers, Link2, Paperclip, Repeat, Tag, Trash2, User, X, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'
import { AttachmentDropZone } from './attachment-drop-zone'
import { TaskActivity } from './task-activity'
import { SubtasksSection } from './subtasks-section'
import { RecurrencePicker } from './recurrence-picker'
import { TaskCommentsSection } from './task-comments-section'
import { CustomFieldsSection } from '@/modules/pms/features/custom-fields/components/custom-fields-section'
import { useSprints } from '@/modules/pms/features/projects/hooks/use-sprints'
import { DependencySelector } from './dependency-selector'
import { FollowButton } from './follow-button'
import api from '@/shared/lib/api'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

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
  const { t } = useTranslation('pms')
  const qc = useQueryClient()
  const [newSubtask, setNewSubtask] = useState('')
  const subtaskRef = useRef<HTMLInputElement>(null)

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId && !!task,
  })

  const { data: subtasks = [] } = useQuery<Task[]>({
    queryKey: ['subtasks', task?.id],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/tasks?include_subtasks=true`).then((r) =>
        r.data.filter((t: Task) => t.parent_id === task?.id),
      ),
    enabled: !!task,
  })

  const { data: workspaceTags = [] } = useQuery<TagItem[]>({
    queryKey: ['workspace-tags', workspaceId],
    queryFn: () => api.get(`/pms/workspaces/${workspaceId}/tags`).then((r) => r.data),
    enabled: !!workspaceId && !!task,
  })

  const { data: taskTags = [] } = useQuery<TagItem[]>({
    queryKey: ['task-tags', task?.id],
    queryFn: () => api.get(`/pms/projects/${projectId}/tasks/${task!.id}/tags`).then((r) => r.data),
    enabled: !!task,
  })

  const updateTask = useMutation({
    mutationFn: (data: Partial<Task>) =>
      api.patch(`/pms/projects/${projectId}/tasks/${task!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/pms/projects/${projectId}/tasks/${task!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      onClose()
    },
  })

  const createSubtask = useMutation({
    mutationFn: (title: string) =>
      api.post(`/pms/projects/${projectId}/tasks`, {
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

  const toggleTag = useMutation({
    mutationFn: ({ tagId, active }: { tagId: string; active: boolean }) =>
      active
        ? api.delete(`/pms/projects/${projectId}/tasks/${task!.id}/tags/${tagId}`)
        : api.post(`/pms/projects/${projectId}/tasks/${task!.id}/tags/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-tags', task!.id] }),
  })

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', task?.id],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/tasks/${task!.id}/attachments`).then((r) => r.data),
    enabled: !!task,
  })

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete(`/pms/projects/${projectId}/tasks/${task!.id}/attachments/${attachmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', task!.id] }),
  })

  async function uploadAttachment(file: File) {
    if (!task) return
    const form = new FormData()
    form.append('file', file)
    await api.post(`/pms/projects/${projectId}/tasks/${task.id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    qc.invalidateQueries({ queryKey: ['attachments', task.id] })
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
                  className="text-base font-semibold text-foreground outline-none flex-1 cursor-text"
                >
                  {task.title}
                </SheetTitle>
                <FollowButton projectId={projectId} taskId={task.id} />
                <button
                  onClick={() => {
                    if (window.confirm(t('common:common.deleteConfirmFull', { name: task.title }))) deleteTask.mutate()
                  }}
                  className="mt-0.5 flex-shrink-0 text-neutral-300 hover:text-red-500 transition-colors"
                  title={t('common:common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {/* Meta */}
              <div className="px-6 py-4 space-y-3 border-b border-border">
                {/* Priority */}
                <MetaRow icon={<Tag className="h-4 w-4" />} label={t('task.priority')}>
                  <Select
                    value={task.priority}
                    onValueChange={(v) => updateTask.mutate({ priority: v })}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs border-0 bg-muted hover:bg-muted/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('task.priority.none')}</SelectItem>
                      <SelectItem value="low">{t('task.priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('task.priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('task.priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </MetaRow>

                {/* Assignee */}
                {members.length > 0 && (
                  <MetaRow icon={<User className="h-4 w-4" />} label={t('task.assignee')}>
                    <Select
                      value={task.assignee_id ?? 'none'}
                      onValueChange={(v) =>
                        updateTask.mutate({ assignee_id: v === 'none' ? null : v })
                      }
                    >
                      <SelectTrigger className="h-7 w-36 text-xs border-0 bg-muted hover:bg-muted/80">
                        <SelectValue placeholder={t('task.assignee')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('task.assignee')}</SelectItem>
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
                <MetaRow icon={<CalendarDays className="h-4 w-4" />} label={t('task.dueDate')}>
                  <input
                    type="date"
                    defaultValue={task.due_date ? task.due_date.slice(0, 10) : ''}
                    onChange={(e) =>
                      updateTask.mutate({ due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                    }
                    className={cn(
                      'text-xs bg-muted rounded px-2 py-1 border-0 outline-none',
                      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                        ? 'text-red-500 font-medium'
                        : 'text-foreground',
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

                {/* Story Points */}
                <MetaRow icon={<Hash className="h-4 w-4" />} label="Points">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={task.story_points ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null
                      updateTask.mutate({ story_points: val } as Partial<Task>)
                    }}
                    className="text-xs bg-muted rounded px-2 py-1 border-0 outline-none w-16 text-foreground"
                    placeholder="--"
                  />
                </MetaRow>

                {/* Task Type */}
                <MetaRow icon={<Layers className="h-4 w-4" />} label="Type">
                  <Select
                    value={task.task_type ?? 'task'}
                    onValueChange={(v) => updateTask.mutate({ task_type: v } as Partial<Task>)}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs border-0 bg-muted hover:bg-muted/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </MetaRow>

                {/* Sprint Assignment */}
                <MetaRow icon={<Zap className="h-4 w-4" />} label="Sprint">
                  <SprintAssignSelect
                    projectId={projectId}
                    value={task.sprint_id}
                    onChange={(v) => updateTask.mutate({ sprint_id: v } as Partial<Task>)}
                  />
                </MetaRow>
              </div>

              {/* Description */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('task.description')}</p>
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
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
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
                          style={{ backgroundColor: tag.color + '22', color: tag.color }}
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
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  <Paperclip className="h-3.5 w-3.5 inline mr-1" />
                  Attachments {attachments.length > 0 && `(${attachments.length})`}
                </p>
                {attachments.length > 0 && (
                  <div className="space-y-1 mb-1">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 py-1 group">
                        <Paperclip className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                        <a
                          href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/pms/projects/${projectId}/tasks/${task!.id}/attachments/${a.id}/download`}
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
                <AttachmentDropZone
                  projectId={projectId}
                  taskId={task.id}
                  onUpload={uploadAttachment}
                />
              </div>

              {/* Dependencies */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  <Link2 className="h-3.5 w-3.5 inline mr-1" />
                  Dependencies
                </p>
                <DependencySelector projectId={projectId} taskId={task.id} />
              </div>

              {/* Subtasks */}
              <div className="px-6 py-4 border-b border-border">
                <SubtasksSection
                  subtasks={subtasks}
                  projectId={projectId}
                  parentTaskId={task.id}
                  newSubtask={newSubtask}
                  subtaskRef={subtaskRef}
                  isPending={createSubtask.isPending}
                  onNewSubtaskChange={setNewSubtask}
                  onCreateSubtask={() => { if (newSubtask.trim()) createSubtask.mutate(newSubtask.trim()) }}
                />
              </div>

              {/* Activity log */}
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  <History className="h-3.5 w-3.5 inline mr-1" />
                  {t('task.activity')}
                </p>
                <TaskActivity taskId={task.id} projectId={projectId} />
              </div>

              {/* Comments */}
              <TaskCommentsSection
                projectId={projectId}
                taskId={task.id}
              />
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

function SprintAssignSelect({
  projectId,
  value,
  onChange,
}: {
  projectId: string
  value: string | null
  onChange: (v: string | null) => void
}) {
  const { data: sprints = [] } = useSprints(projectId)
  return (
    <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
      <SelectTrigger className="h-7 w-36 text-xs border-0 bg-muted hover:bg-muted/80">
        <SelectValue placeholder="No sprint" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No sprint</SelectItem>
        {sprints
          .filter((s) => s.status !== 'completed')
          .map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
