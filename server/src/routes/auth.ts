import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { supabaseAdmin } from '../lib/supabase.js'

const auth = new Hono()

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (error) {
    return c.json({ message: error.message }, 401)
  }

  const { session } = data
  const isSecure = process.env.NODE_ENV === 'production'

  setCookie(c, 'access_token', session.access_token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: session.expires_in,
  })
  setCookie(c, 'refresh_token', session.refresh_token!, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  // Look up staff record
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (staffError || !staff) {
    // Authenticated but no staff record — clean up
    deleteCookie(c, 'access_token')
    deleteCookie(c, 'refresh_token')
    return c.json({ message: 'Staff record not found' }, 403)
  }

  return c.json({
    data: {
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      staff,
    },
  })
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const accessToken = getCookie(c, 'access_token')

  if (accessToken) {
    await supabaseAdmin.auth.admin.signOut(accessToken)
  }

  deleteCookie(c, 'access_token', { path: '/' })
  deleteCookie(c, 'refresh_token', { path: '/' })

  return c.json({ data: { message: 'Logged out' } })
})

// GET /api/auth/session
auth.get('/session', async (c) => {
  const accessToken = getCookie(c, 'access_token')
  const refreshToken = getCookie(c, 'refresh_token')

  if (!accessToken && !refreshToken) {
    return c.json({ data: null })
  }

  let token = accessToken
  const isSecure = process.env.NODE_ENV === 'production'

  // Try existing access token
  if (token) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && user) {
      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!staff) return c.json({ data: null })

      return c.json({
        data: {
          user: { id: user.id, email: user.email },
          staff,
        },
      })
    }
  }

  // Try refresh
  if (refreshToken) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken })
    if (!error && data.session) {
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
        maxAge: 60 * 60 * 24 * 30,
      })

      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('*')
        .eq('user_id', data.session.user.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!staff) return c.json({ data: null })

      return c.json({
        data: {
          user: { id: data.session.user.id, email: data.session.user.email },
          staff,
        },
      })
    }
  }

  // Both tokens invalid
  deleteCookie(c, 'access_token', { path: '/' })
  deleteCookie(c, 'refresh_token', { path: '/' })
  return c.json({ data: null })
})

export { auth }
