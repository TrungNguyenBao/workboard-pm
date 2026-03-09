import { Layers } from 'lucide-react'
import { ProjectHeader } from '../components/project-header'

export default function SprintsPage() {
  return (
    <div className="flex flex-col h-full">
      <ProjectHeader activeView="sprints" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Layers className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Sprints — coming soon</p>
        <p className="text-xs opacity-70">Sprint analytics and velocity charts will appear here.</p>
      </div>
    </div>
  )
}
