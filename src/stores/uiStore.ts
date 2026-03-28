import { create } from 'zustand'

interface UIState {
  selectedStoreId: string | null
  sidebarOpen: boolean
  setSelectedStoreId: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedStoreId: null,
  sidebarOpen: true,
  setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
