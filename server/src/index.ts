import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root (parent of server/)
config({ path: resolve(import.meta.dirname, '../../.env') })

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './routes/auth.js'
import { pub } from './routes/public.js'
import { admin } from './routes/admin.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.APP_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// API routes
app.route('/api/auth', auth)
app.route('/api/public', pub)
app.route('/api/admin', admin)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('*', serveStatic({ root: './dist' }))

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', serveStatic({ root: './dist', path: 'index.html' }))
}

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})

export default app
