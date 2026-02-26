import { create } from 'zustand'
import api, { setAccessToken } from '@/shared/lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url: string | null
  is_active: boolean
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setUser: (user: AuthUser) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  async login(email, password) {
    const { data } = await api.post<{ access_token: string }>('/auth/login', { email, password })
    setAccessToken(data.access_token)
    const me = await api.get<AuthUser>('/auth/me')
    set({ user: me.data })
  },

  async register(email, name, password) {
    const { data } = await api.post<{ access_token: string }>('/auth/register', { email, name, password })
    setAccessToken(data.access_token)
    const me = await api.get<AuthUser>('/auth/me')
    set({ user: me.data })
  },

  async logout() {
    await api.post('/auth/logout').catch(() => {})
    setAccessToken(null)
    set({ user: null })
  },

  setUser(user: AuthUser) {
    set({ user })
  },

  async fetchMe() {
    set({ isLoading: true })
    try {
      // Try to get a fresh access token via refresh cookie
      const refresh = await api.post<{ access_token: string }>('/auth/refresh')
      setAccessToken(refresh.data.access_token)
      const me = await api.get<AuthUser>('/auth/me')
      set({ user: me.data })
    } catch {
      setAccessToken(null)
      set({ user: null })
    } finally {
      set({ isLoading: false })
    }
  },
}))
