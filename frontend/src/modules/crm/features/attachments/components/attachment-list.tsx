import { FileText, Image, FileSpreadsheet, File, Trash2, Download } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from '@/shared/components/ui/toast'
import { ATTACHMENT_CATEGORIES, useAttachments, useDeleteAttachment } from '../hooks/use-attachments'

interface Props {
  workspaceId: string
  entityType: string
  entityId: string
}

function fileIcon(fileType: string): React.ReactNode {
  if (fileType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv'))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
  if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('text'))
    return <FileText className="h-4 w-4 text-orange-500" />
  return <File className="h-4 w-4 text-muted-foreground" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AttachmentList({ workspaceId, entityType, entityId }: Props) {
  const { data: attachments = [], isLoading } = useAttachments(workspaceId, entityType, entityId)
  const deleteAttachment = useDeleteAttachment(workspaceId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">Loading attachments…</p>
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8">
        <File className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No attachments yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {attachments.map((a) => {
        const categoryLabel = ATTACHMENT_CATEGORIES.find((c) => c.value === a.category)?.label
        return (
          <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 group hover:bg-muted/30 transition-colors">
            <span className="shrink-0">{fileIcon(a.file_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.file_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatSize(a.file_size)}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </div>
            </div>
            {categoryLabel && (
              <Badge variant="secondary" className="text-xs shrink-0">{categoryLabel}</Badge>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
              <a
                href={a.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={a.file_name}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
              <button
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
                onClick={async () => {
                  if (window.confirm(`Delete "${a.file_name}"?`)) {
                    await deleteAttachment.mutateAsync({
                      attachmentId: a.id,
                      entityType,
                      entityId,
                    })
                    toast({ title: 'Attachment deleted', variant: 'success' })
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
