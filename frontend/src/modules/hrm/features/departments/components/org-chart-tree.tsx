import { useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { DepartmentTreeNode } from '../hooks/use-org-tree'

interface NodeProps {
  node: DepartmentTreeNode
  depth: number
}

function OrgChartNode({ node, depth }: NodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-neutral-50 transition-colors',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-neutral-400"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="h-3.5 w-3.5 block" />
          )}
        </button>

        <div className="flex flex-1 min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{node.name}</p>
            {node.manager_name && (
              <p className="text-xs text-neutral-500 truncate">Manager: {node.manager_name}</p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-500">{node.employee_count}</span>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <OrgChartNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  nodes: DepartmentTreeNode[]
}

export function OrgChartTree({ nodes }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-neutral-400">No departments found</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {nodes.map((node) => (
        <OrgChartNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  )
}
