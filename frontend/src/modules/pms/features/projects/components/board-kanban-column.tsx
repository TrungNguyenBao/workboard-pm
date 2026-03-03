import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'
import { BoardTaskCard } from './board-task-card'
import { InlineTaskInput } from '../components/inline-task-input'
import { useUpdateSection, useDeleteSection, type Task, type Section } from '../hooks/use-project-tasks'

interface BoardKanbanColumnProps {
  section: Section
  tasks: Task[]
  projectId: string
  onOpenTask: (t: Task) => void
}

/** Kanban column with droppable zone and sortable task list */
export function BoardKanbanColumn({ section, tasks, projectId, onOpenTask }: BoardKanbanColumnProps) {
  const { t } = useTranslation('pms')
  const taskIds = tasks.map((t) => t.id)
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(section.name)
  const updateSection = useUpdateSection(projectId)
  const deleteSection = useDeleteSection(projectId)

  // Make column itself droppable so empty columns can receive drops
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `column-${section.id}`, data: { sectionId: section.id } })

  function commitRename() {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== section.name) {
      updateSection.mutate({ sectionId: section.id, name: trimmed })
    }
    setRenaming(false)
  }

  return (
    <div className="flex w-64 flex-shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {section.color && (
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
          )}
          {renaming ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setRenaming(false); setNameInput(section.name) }
              }}
              className="text-sm font-medium text-neutral-700 bg-white border border-primary rounded px-1 outline-none w-full"
            />
          ) : (
            <span className="text-sm font-medium text-neutral-700 truncate">{section.name}</span>
          )}
          <span className="text-xs text-neutral-400 flex-shrink-0">{tasks.length}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setNameInput(section.name); setRenaming(true) }}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              {t('common:common.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => {
                if (window.confirm(t('project.deleteConfirm', { name: section.name }))) {
                  deleteSection.mutate(section.id)
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              {t('common:common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="min-h-[60px] space-y-2 rounded-md bg-neutral-50 p-2">
          {tasks.length === 0 && (
            <p className="py-4 text-center text-xs text-neutral-400">No tasks</p>
          )}
          {tasks.map((task) => (
            <BoardTaskCard key={task.id} task={task} onOpen={onOpenTask} projectId={projectId} />
          ))}
        </div>
      </SortableContext>
      <InlineTaskInput projectId={projectId} sectionId={section.id} variant="card" />
    </div>
  )
}
