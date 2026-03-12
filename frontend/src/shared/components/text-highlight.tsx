import { cn } from '@/shared/lib/utils'

interface Props {
  text: string
  query: string
  className?: string
}

export function TextHighlight({ text, query, className }: Props) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className={cn(
              'bg-yellow-200 text-yellow-900 rounded-[2px] px-px',
              'dark:bg-yellow-700 dark:text-yellow-100',
            )}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  )
}
