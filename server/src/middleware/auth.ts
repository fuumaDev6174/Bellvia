import { createMiddleware } from 'hono/factory'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { supabaseAdmin } from '../lib/supabase.js'

interface StaffContext {
  id: string
  userId: string
  storeId: string
  companyId: string
  role: string
  displayName: string
}

// Extend Hono context variables
declare module 'hono' {
  interface ContextVariableMap {
    accessToken: string
    staff: StaffContext
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const accessToken = getCookie(c, 'access_token')
  const refreshToken = getCookie(c, 'refresh_token')

  if (!accessToken && !refreshToken) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  let token = accessToken

  // Try to verify the access token
  if (token) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && user) {
      const staff = await lookupStaff(user.id)
      if (!staff) {
        return c.json({ message: 'Staff record not found' }, 403)
      }
      c.set('accessToken', token)
      c.set('staff', staff)
      return next()
    }
  }

  // Access token expired or missing — try refresh
  if (refreshToken) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken })
    if (!error && data.session) {
      const isSecure = process.env.NODE_ENV === 'production'

      setCookie(c, 'access_token', data.session.access_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'Lax',
        path: '/',
        maxAge: data.session.expires_in,
      })
      setCookie(c, 'refresh_token', data.session.refresh_token!, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      const staff = await lookupStaff(data.session.user.id)
      if (!staff) {
        return c.json({ message: 'Staff record not found' }, 403)
      }
      c.set('accessToken', data.session.access_token)
      c.set('staff', staff)
      return next()
    }
  }

  // Both tokens invalid — clear cookies
  deleteCookie(c, 'access_token')
  deleteCookie(c, 'refresh_token')
  return c.json({ message: 'Session expired' }, 401)
})

async function lookupStaff(userId: string): Promise<StaffContext | null> {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('id, user_id, store_id, company_id, role, display_name')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    storeId: data.store_id,
    companyId: data.company_id,
    role: data.role,
    displayName: data.display_name,
  }
}
