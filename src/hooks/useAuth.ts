import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuthListener() {
  const { setSession, setCurrentStaff, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchStaff(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchStaff(session.user.id)
      } else {
        setCurrentStaff(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setCurrentStaff, setLoading])

  async function fetchStaff(userId: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error) {
      setCurrentStaff(null)
    } else {
      setCurrentStaff(data)
    }
    setLoading(false)
  }
}

export function useSignIn() {
  return async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
}

export function useSignOut() {
  const { clear } = useAuthStore()
  return async () => {
    await supabase.auth.signOut()
    clear()
  }
}
