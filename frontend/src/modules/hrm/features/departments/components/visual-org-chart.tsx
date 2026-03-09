import { useOrgTree } from '../hooks/use-org-tree'
import { OrgChartNode } from './org-chart-node'

interface VisualOrgChartProps {
  workspaceId: string
}

/**
 * CSS-based hierarchical org chart.
 * Fetches the department tree and renders it using OrgChartNode recursively.
 * Render depth is limited to 5 levels inside OrgChartNode.
 */
export function VisualOrgChart({ workspaceId }: VisualOrgChartProps) {
  const { data: roots, isLoading, isError } = useOrgTree(workspaceId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Loading org chart…
      </div>
    )
  }

  if (isError || !roots) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-destructive">
        Failed to load org chart.
      </div>
    )
  }

  if (roots.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No departments found.
      </div>
    )
  }

  return (
    <div className="overflow-auto p-6">
      {/* Horizontal row of root departments */}
      <div className="flex gap-10 justify-center">
        {roots.map((root) => (
          <OrgChartNode key={root.id} node={root} depth={0} />
        ))}
      </div>
    </div>
  )
}
