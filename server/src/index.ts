import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from project root (parent of server/)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

// Dynamic imports AFTER dotenv is loaded
const { serve } = await import('@hono/node-server')
const { serveStatic } = await import('@hono/node-server/serve-static')
const { Hono } = await import('hono')
const { cors } = await import('hono/cors')
const { logger } = await import('hono/logger')
const { auth } = await import('./routes/auth.js')
const { pub } = await import('./routes/public.js')
const { admin } = await import('./routes/admin.js')

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
