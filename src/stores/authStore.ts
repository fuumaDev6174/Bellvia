import { create } from 'zustand'
import type { Staff } from '@/types/models'

interface AuthUser {
  id: string
  email: string | undefined
}

interface AuthState {
  user: AuthUser | null
  currentStaff: Staff | null
  isLoading: boolean
  isAuthenticated: boolean
  setAuth: (user: AuthUser | null, staff: Staff | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  currentStaff: null,
  isLoading: true,
  isAuthenticated: false,
  setAuth: (user, currentStaff) =>
    set({
      user,
      currentStaff,
      isAuthenticated: !!user && !!currentStaff,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () =>
    set({
      user: null,
      currentStaff: null,
      isLoading: false,
      isAuthenticated: false,
    }),
}))
