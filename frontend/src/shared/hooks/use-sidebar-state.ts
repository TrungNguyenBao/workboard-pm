import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean
  toggleCollapsed: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export const useSidebarState = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      mobileOpen: false,
      setMobileOpen: (open: boolean) => set({ mobileOpen: open }),
    }),
    {
      name: 'a-erp-sidebar',
      partialize: (state) => ({ collapsed: state.collapsed }),
    },
  ),
)
