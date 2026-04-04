import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const url: string = supabaseUrl
const serviceKey: string = supabaseServiceRoleKey

// Admin client - bypasses RLS, use for server-side operations
export const supabaseAdmin = createClient(url, serviceKey)

// Create a per-request client with the user's JWT for RLS-respecting queries
export function createUserClient(accessToken: string) {
  if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable')
  }
  return createClient(url, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
