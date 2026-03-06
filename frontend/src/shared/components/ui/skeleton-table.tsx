interface SkeletonTableProps {
  rows?: number
  columns?: number
}

function SkeletonCell({ wide }: { wide?: boolean }) {
  return (
    <div className={`h-4 bg-muted animate-pulse rounded ${wide ? 'w-3/4' : 'w-1/2'}`} />
  )
}

function SkeletonRow({ columns, isHeader }: { columns: number; isHeader?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b border-border ${isHeader ? 'bg-muted/50' : ''}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex-1">
          <SkeletonCell wide={i === 0} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="rounded border border-border overflow-hidden">
      <SkeletonRow columns={columns} isHeader />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  )
}
