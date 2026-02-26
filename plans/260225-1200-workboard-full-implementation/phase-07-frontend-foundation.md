# Phase 07 — Frontend Foundation

## Overview
- **Priority:** Critical
- **Status:** Pending
- **Description:** Vite + React Router, auth store, Axios, TanStack Query, shadcn/ui, app shell layout

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md)
- [Wireframe 01](../../docs/wireframe/01-app-shell.html)
- [Stack Research](../reports/researcher-stack-react-fastapi-postgresql.md) §6–9

## Related Code Files

### Create
```
frontend/src/
  app/
    App.tsx
    router.tsx
  stores/
    authStore.ts         # Zustand auth store
    workspaceStore.ts    # active workspace
  shared/
    lib/
      axiosInstance.ts   # Axios with auto-refresh interceptor
      queryClient.ts     # TanStack Query client config
    components/
      ProtectedRoute.tsx
      AppShell.tsx        # sidebar + top bar layout
      Sidebar.tsx
      TopBar.tsx
      NotificationBell.tsx (placeholder)
  features/
    auth/
      api/auth.api.ts
      hooks/useAuth.ts
```

## Implementation Steps

### 1. Zustand auth store (stores/authStore.ts)
```typescript
import { create } from 'zustand'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setAccessToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  setAccessToken: (accessToken) => set({ accessToken }),
}))
// NOTE: no persist for accessToken — stays in memory only
```

### 2. Axios instance (shared/lib/axiosInstance.ts)
```typescript
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({ baseURL: '/api/v1', withCredentials: true })

// Inject access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → attempt refresh → retry once
let refreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      refreshing = true
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        useAuthStore.getState().setAccessToken(data.access_token)
        queue.forEach(cb => cb(data.access_token))
        queue = []
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)
```

### 3. TanStack Query client (shared/lib/queryClient.ts)
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
```

### 4. App router (app/router.tsx)
```typescript
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },           // My Tasks
      { path: 'inbox', element: <InboxPage /> },
      { path: 'projects/:projectId', element: <ProjectPage /> }, // board/list/calendar
      { path: 'search', element: <SearchPage /> },
    ]
  }
])
```

### 5. ProtectedRoute (shared/components/ProtectedRoute.tsx)
```typescript
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount: try /auth/refresh to restore session from HttpOnly cookie
    if (!isAuthenticated) {
      api.post('/auth/refresh')
        .then(({ data }) => {
          useAuthStore.getState().setAuth(data.user, data.access_token)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) return <FullPageSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
```

### 6. AppShell (exact layout per wireframe 01)
```typescript
// AppShell.tsx
// - Fixed sidebar 240px wide
// - Top bar 48px
// - <Outlet /> for main content
// - Sidebar collapses to 48px via toggle (stored in localStorage)
```

**Sidebar sections:**
1. Logo + workspace name
2. Main nav: Home (My Tasks), Inbox (notification count badge)
3. Projects section: list of joined projects, "+ New Project" button
4. Bottom: user avatar + name + settings

**TopBar:**
- Breadcrumb (current page/project name)
- Global search trigger (opens cmdk)
- Notification bell (opens dropdown)
- User menu (profile, settings, logout)

### 7. Tailwind design tokens (tailwind.config.ts)
```typescript
theme: {
  extend: {
    fontFamily: { sans: ['DM Sans', 'sans-serif'] },
    colors: {
      primary: { DEFAULT: '#5E6AD2', hover: '#4F55C4' },
      accent: { DEFAULT: '#F28C38', hover: '#E07620' },
      // ... all neutral shades from design-guidelines.md
    },
    spacing: { /* 4px grid tokens */ },
    borderRadius: { sm: '6px', md: '8px', lg: '12px' }
  }
}
```

### 8. shadcn/ui global CSS overrides (src/index.css)
Per design-guidelines.md shadcn/ui customization section:
```css
@layer base {
  :root {
    --radius: 0.5rem;
    --primary: 94 106 210;
    --primary-foreground: 0 0% 100%;
    --accent: 33 89% 58%;
    --muted: 240 5% 96%;
    --border: 240 6% 90%;
    --card: 0 0% 100%;
    --background: 0 0% 100%;
    --foreground: 240 5% 10%;
  }
  .dark {
    --background: 240 10% 7%;
    --primary: 232 55% 68%;  /* lightened for dark mode */
  }
}
```

## Todo
- [ ] Create stores/authStore.ts (no persist for token)
- [ ] Create shared/lib/axiosInstance.ts (with refresh interceptor)
- [ ] Create shared/lib/queryClient.ts
- [ ] Create app/router.tsx with all routes
- [ ] Create ProtectedRoute (session restore on mount)
- [ ] Create AppShell: sidebar + topbar + Outlet
- [ ] Create Sidebar with nav items + project list
- [ ] Create TopBar with search trigger + bell + user menu
- [ ] Apply Tailwind design tokens from design-guidelines.md
- [ ] Apply shadcn/ui CSS variable overrides
- [ ] Verify DM Sans loads from Google Fonts
- [ ] Verify sidebar collapse works + persists in localStorage

## Success Criteria
- `/login` renders without errors
- Visiting `/` without auth → redirect to `/login`
- After login → redirect to `/` → My Tasks dashboard shows (placeholder OK)
- Page reload restores session via refresh cookie
- Sidebar and top bar match wireframe 01 visually

## Security Considerations
- Access token ONLY in Zustand memory — never localStorage, never sessionStorage
- `withCredentials: true` on all Axios calls (for refresh cookie)
- CSRF: SameSite=Strict cookie provides CSRF protection for refresh endpoint

## Next Steps
→ Phase 08: auth pages (login, register)
→ Phase 09: project views (can parallelize)
