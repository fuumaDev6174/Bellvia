import { createMiddleware } from 'hono/factory'
import { getCookie, deleteCookie } from 'hono/cookie'
import { verifySessionToken, lookupStaff } from '../lib/auth.js'
import type { StaffContext } from '../lib/auth.js'

// Extend Hono context variables
declare module 'hono' {
  interface ContextVariableMap {
    staff: StaffContext
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'session_token')

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    deleteCookie(c, 'session_token', { path: '/' })
    return c.json({ message: 'Session expired' }, 401)
  }

  const staffCtx = await lookupStaff(payload.userId)
  if (!staffCtx) {
    return c.json({ message: 'Staff record not found' }, 403)
  }

  c.set('staff', staffCtx)
  return next()
})
