import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { ATTACHMENT_CATEGORIES, useUploadAttachment } from '../hooks/use-attachments'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

interface Props {
  workspaceId: string
  entityType: string
  entityId: string
  onUploaded?: () => void
}

export function AttachmentUpload({ workspaceId, entityType, entityId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('other')
  const upload = useUploadAttachment(workspaceId)

  function validateAndSet(f: File) {
    if (f.size > MAX_SIZE_BYTES) {
      toast({ title: 'File too large (max 10 MB)', variant: 'error' })
      return
    }
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSet(dropped)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) validateAndSet(selected)
    e.target.value = ''
  }

  async function handleUpload() {
    if (!file) return
    try {
      await upload.mutateAsync({ file, entityType, entityId, category })
      toast({ title: 'File uploaded', variant: 'success' })
      setFile(null)
      setCategory('other')
      onUploaded?.()
    } catch {
      toast({ title: 'Upload failed', variant: 'error' })
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileInput} />
        <div className="flex flex-col items-center gap-1.5 py-6 px-4 text-center pointer-events-none">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop or <span className="text-foreground font-medium">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">Max 10 MB</p>
        </div>
      </div>

      {file && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <span className="flex-1 text-sm truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {(file.size / 1024).toFixed(0)} KB
          </span>
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setFile(null)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="space-y-1.5 flex-1">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ATTACHMENT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          disabled={!file || upload.isPending}
          onClick={handleUpload}
          className="shrink-0"
        >
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}
