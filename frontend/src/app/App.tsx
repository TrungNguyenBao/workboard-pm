import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/shared/lib/query-client'
import { AppRouter } from './router'
import { useAuthStore } from '@/stores/auth.store'
import { Toaster } from '@/shared/components/ui/toast'

function AuthBootstrapper({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrapper>
        <AppRouter />
        <Toaster />
      </AuthBootstrapper>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
