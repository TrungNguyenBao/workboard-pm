import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Code, List } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface Props {
  onSubmit: (html: string) => void
  onCancel?: () => void
  initialContent?: string
  placeholder?: string
  submitLabel?: string
  disabled?: boolean
}

export function CommentEditor({
  onSubmit,
  onCancel,
  initialContent = '',
  placeholder = 'Leave a comment…',
  submitLabel = 'Post',
  disabled = false,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'min-h-[64px] max-h-[200px] overflow-y-auto px-3 py-2 text-sm outline-none prose prose-sm max-w-none',
      },
    },
  })

  function handleSubmit() {
    if (!editor) return
    const html = editor.getHTML()
    const isEmpty = editor.isEmpty
    if (isEmpty) return
    onSubmit(html)
    editor.commands.clearContent()
  }

  if (!editor) return null

  const toolbarBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, title: string) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        'p-1 rounded transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/40">
        {toolbarBtn(
          editor.isActive('bold'),
          () => editor.chain().focus().toggleBold().run(),
          <Bold className="h-3.5 w-3.5" />,
          'Bold',
        )}
        {toolbarBtn(
          editor.isActive('italic'),
          () => editor.chain().focus().toggleItalic().run(),
          <Italic className="h-3.5 w-3.5" />,
          'Italic',
        )}
        {toolbarBtn(
          editor.isActive('code'),
          () => editor.chain().focus().toggleCode().run(),
          <Code className="h-3.5 w-3.5" />,
          'Inline code',
        )}
        {toolbarBtn(
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
          <List className="h-3.5 w-3.5" />,
          'Bullet list',
        )}
      </div>

      {/* Editor area */}
      <div
        onClick={() => editor.commands.focus()}
        className="relative cursor-text bg-background"
      >
        {editor.isEmpty && (
          <span className="absolute left-3 top-2 text-sm text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Footer actions */}
      {(!editor.isEmpty || onCancel) && (
        <div className="flex items-center justify-end gap-2 px-2 py-1.5 border-t border-border bg-muted/20">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={disabled}>
              Cancel
            </Button>
          )}
          {!editor.isEmpty && (
            <Button size="sm" onClick={handleSubmit} disabled={disabled}>
              {submitLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
