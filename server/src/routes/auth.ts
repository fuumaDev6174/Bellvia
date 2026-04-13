import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { db } from '../db/index.js'
import { staff as staffTable } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import {
  authenticateUser,
  lookupStaff,
  createSessionToken,
  verifySessionToken,
  SESSION_MAX_AGE,
} from '../lib/auth.js'

const auth = new Hono()

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()

  const user = await authenticateUser(email, password)
  if (!user) {
    return c.json({ message: 'メールアドレスまたはパスワードが正しくありません' }, 401)
  }

  // Look up staff record
  const staffCtx = await lookupStaff(user.id)
  if (!staffCtx) {
    return c.json({ message: 'Staff record not found' }, 403)
  }

  // Get full staff record for response
  const [staffRecord] = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.userId, user.id), eq(staffTable.isActive, true)))
    .limit(1)

  const isSecure = process.env.NODE_ENV === 'production'
  const token = createSessionToken({ userId: user.id, email: user.email ?? '' })

  setCookie(c, 'session_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return c.json({
    data: {
      user: { id: user.id, email: user.email },
      staff: staffRecord,
    },
  })
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  deleteCookie(c, 'session_token', { path: '/' })
  return c.json({ data: { message: 'Logged out' } })
})

// GET /api/auth/session
auth.get('/session', async (c) => {
  const token = getCookie(c, 'session_token')
  if (!token) {
    return c.json({ data: null })
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    deleteCookie(c, 'session_token', { path: '/' })
    return c.json({ data: null })
  }

  const staffCtx = await lookupStaff(payload.userId)
  if (!staffCtx) {
    deleteCookie(c, 'session_token', { path: '/' })
    return c.json({ data: null })
  }

  // Get full staff record
  const [staffRecord] = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.userId, payload.userId), eq(staffTable.isActive, true)))
    .limit(1)

  return c.json({
    data: {
      user: { id: payload.userId, email: payload.email },
      staff: staffRecord,
    },
  })
})

export { auth }
