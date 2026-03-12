import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface Props {
  projectId: string
  taskId: string
  onUpload: (file: File) => Promise<void>
}

export function AttachmentDropZone({ onUpload }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        await onUpload(file)
      }
    } finally {
      setIsUploading(false)
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    // Only leave if exiting the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'relative mt-2 rounded-md border-2 border-dashed px-4 py-3 text-center transition-all',
        isDragOver
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-border hover:border-primary/50',
        isUploading && 'opacity-60 pointer-events-none',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {isUploading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Uploading…
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Upload className={cn('h-4 w-4', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn('text-xs', isDragOver ? 'text-primary font-medium' : 'text-muted-foreground')}>
            {isDragOver ? 'Drop to upload' : 'Drop files here or '}
            {!isDragOver && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-primary hover:underline focus:outline-none"
              >
                browse
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
