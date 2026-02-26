import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
  activeWorkspaceId: string | null
  setActiveWorkspace: (id: string) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      clearWorkspace: () => set({ activeWorkspaceId: null }),
    }),
    { name: 'wb-workspace' },
  ),
)
