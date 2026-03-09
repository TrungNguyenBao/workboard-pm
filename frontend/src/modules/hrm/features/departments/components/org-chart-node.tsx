import { useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { DepartmentTreeNode } from '../hooks/use-org-tree'

interface OrgChartNodeProps {
  node: DepartmentTreeNode
  depth: number
}

const MAX_DEPTH = 5

/** Single department box with expand/collapse for children */
export function OrgChartNode({ node, depth }: OrgChartNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Department box */}
      <div
        className={cn(
          'rounded-lg border border-border bg-card px-4 py-3 shadow-sm min-w-[160px] max-w-[200px] text-center',
          'hover:shadow-md hover:border-primary/50 transition-all cursor-default',
        )}
      >
        <p className="text-sm font-semibold text-foreground truncate">{node.name}</p>
        {node.manager_name && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{node.manager_name}</p>
        )}
        <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{node.employee_count}</span>
        </div>
      </div>

      {/* Expand/collapse toggle */}
      {hasChildren && depth < MAX_DEPTH && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {node.children.length}
        </button>
      )}

      {/* Children subtree */}
      {hasChildren && expanded && depth < MAX_DEPTH && (
        <div className="mt-4 flex gap-6 relative before:absolute before:top-0 before:left-1/2 before:h-4 before:w-px before:bg-border">
          {node.children.map((child) => (
            <div key={child.id} className="flex flex-col items-center relative">
              {/* Connector line from parent to child */}
              <div className="absolute -top-4 left-1/2 h-4 w-px bg-border" />
              <OrgChartNode node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
