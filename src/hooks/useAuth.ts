import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Staff } from '@/types/models'

type SessionResponse = {
  user: { id: string; email: string | undefined }
  staff: Staff
} | null

export function useAuthListener() {
  const { setAuth, setLoading } = useAuthStore()

  useEffect(() => {
    api<SessionResponse>('/api/auth/session')
      .then((data) => {
        if (data) {
          setAuth(data.user, data.staff)
        } else {
          setAuth(null, null)
        }
      })
      .catch(() => {
        setAuth(null, null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [setAuth, setLoading])
}

export function useSignIn() {
  const { setAuth } = useAuthStore()

  return async (email: string, password: string) => {
    const data = await api<{ user: { id: string; email: string | undefined }; staff: Staff }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )
    setAuth(data.user, data.staff)
  }
}

export function useSignOut() {
  const { clear } = useAuthStore()

  return async () => {
    await api('/api/auth/logout', { method: 'POST' })
    clear()
  }
}
