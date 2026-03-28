import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Staff } from '@/types/models'

interface AuthState {
  session: Session | null
  currentStaff: Staff | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setCurrentStaff: (staff: Staff | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  currentStaff: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setCurrentStaff: (currentStaff) => set({ currentStaff }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ session: null, currentStaff: null, isLoading: false }),
}))
