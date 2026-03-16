import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FolderKanban, List, LayoutGrid } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { PageHeader } from '@/shared/components/ui/page-header'
import { Badge } from '@/shared/components/ui/badge'
import { EmptyState } from '@/shared/components/ui/empty-state'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/shared/components/ui/select'
import { CreateProjectDialog } from '../components/create-project-dialog'
import api from '@/shared/lib/api'

interface Project {
  id: string
  name: string
  color: string
  description: string | null
  is_archived: boolean
  visibility: string
  project_type: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  kanban: <LayoutGrid className="h-3.5 w-3.5" />,
  list: <List className="h-3.5 w-3.5" />,
  board: <LayoutGrid className="h-3.5 w-3.5" />,
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </p>
          {project.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1 capitalize">
              {TYPE_ICON[project.project_type] ?? <LayoutGrid className="h-3.5 w-3.5" />}
              {project.project_type}
            </Badge>
            {project.is_archived && (
              <Badge variant="outline">Archived</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function ProjectsListPage() {
  const navigate = useNavigate()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [archivedFilter, setArchivedFilter] = useState('active')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => api.get(`/pms/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (archivedFilter === 'active' && p.is_archived) return false
    if (archivedFilter === 'archived' && !p.is_archived) return false
    if (visibilityFilter !== 'all' && p.visibility !== visibilityFilter) return false
    return true
  })

  function openProject(p: Project) {
    const view = p.project_type === 'list' ? 'list' : 'board'
    navigate(`/pms/projects/${p.id}/${view}`)
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const filters = (
    <div className="flex items-center gap-2">
      <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="team">Team</SelectItem>
          <SelectItem value="private">Private</SelectItem>
        </SelectContent>
      </Select>
      <Select value={archivedFilter} onValueChange={setArchivedFilter}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active only</SelectItem>
          <SelectItem value="archived">Archived only</SelectItem>
          <SelectItem value="all">All projects</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <>
      <PageHeader
        title="Projects"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects..."
        onCreateClick={() => setCreateOpen(true)}
        createLabel="New Project"
        filters={filters}
      />

      <div className="p-4 sm:p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-7 w-7" />}
            title={search || visibilityFilter !== 'all' || archivedFilter !== 'active' ? 'No projects match your filters' : 'No projects yet'}
            description={!search && visibilityFilter === 'all' && archivedFilter === 'active' ? 'Create your first project to get started.' : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => openProject(p)} />
            ))}
          </div>
        )}
      </div>

      {activeWorkspaceId && (
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          workspaceId={activeWorkspaceId}
        />
      )}
    </>
  )
}
