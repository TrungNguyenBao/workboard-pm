import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { create } from 'zustand'

// Simple in-memory toast store
interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

interface ToastStore {
  toasts: ToastItem[]
  add: (t: Omit<ToastItem, 'id'>) => void
  remove: (id: string) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: Math.random().toString(36).slice(2) }],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// eslint-disable-next-line react-refresh/only-export-components
export function toast(t: Omit<ToastItem, 'id'>) {
  useToastStore.getState().add(t)
}

export function Toaster() {
  const { toasts, remove } = useToastStore()
  return (
    <ToastPrimitive.Provider>
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => !open && remove(t.id)}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border p-4 shadow-popover bg-popover',
            t.variant === 'error' && 'border-red-200 bg-red-50',
            t.variant === 'success' && 'border-green-200 bg-green-50',
          )}
        >
          <div className="flex-1">
            <ToastPrimitive.Title className="text-sm font-medium text-foreground">{t.title}</ToastPrimitive.Title>
            {t.description && (
              <ToastPrimitive.Description className="text-xs text-muted-foreground mt-0.5">{t.description}</ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close className="opacity-60 hover:opacity-100">
            <X className="h-3 w-3" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen flex-col gap-2 w-80" />
    </ToastPrimitive.Provider>
  )
}
