import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'

const pub = new Hono()

// GET /api/public/stores
pub.get('/stores', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*, business_hours:store_business_hours(*)')
    .eq('is_active', true)
    .order('name')

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// GET /api/public/stores/:slug
pub.get('/stores/:slug', async (c) => {
  const slug = c.req.param('slug')

  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*, business_hours:store_business_hours(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return c.json({ message: 'Store not found' }, 404)
    return c.json({ message: error.message }, 500)
  }
  return c.json({ data })
})

// GET /api/public/stores/:storeId/menus
pub.get('/stores/:storeId/menus', async (c) => {
  const storeId = c.req.param('storeId')

  const { data, error } = await supabaseAdmin
    .from('menus')
    .select('*, category:category_id (id, name)')
    .eq('store_id', storeId)
    .eq('is_public', true)
    .order('sort_order')

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// GET /api/public/stores/:storeId/stylists
pub.get('/stores/:storeId/stylists', async (c) => {
  const storeId = c.req.param('storeId')

  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('*, specialties:staff_specialties(specialty)')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('sort_order')

  if (error) return c.json({ message: error.message }, 500)

  // Flatten specialties
  const result = (data ?? []).map(s => ({
    ...s,
    specialties: ((s as Record<string, unknown>).specialties as Array<{ specialty: string }> | null)?.map(sp => sp.specialty) ?? [],
  }))

  return c.json({ data: result })
})

// GET /api/public/stores/:storeId/available-slots
pub.get('/stores/:storeId/available-slots', async (c) => {
  const storeId = c.req.param('storeId')
  const date = c.req.query('date')
  const menuId = c.req.query('menuId')
  const staffId = c.req.query('staffId')

  if (!date || !menuId) {
    return c.json({ message: 'date and menuId are required' }, 400)
  }

  const params: Record<string, string> = {
    p_store_id: storeId,
    p_date: date,
    p_menu_id: menuId,
  }
  if (staffId) params.p_staff_id = staffId

  const { data, error } = await supabaseAdmin.rpc('get_available_slots', params)
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// POST /api/public/reservations
pub.post('/reservations', async (c) => {
  const body = await c.req.json<{
    storeId: string
    staffId: string
    menuId: string
    startAt: string
    guestName: string
    guestPhone: string
    guestEmail?: string
    notes?: string
  }>()

  const params: Record<string, string> = {
    p_store_id: body.storeId,
    p_staff_id: body.staffId,
    p_menu_id: body.menuId,
    p_start_at: body.startAt,
    p_guest_name: body.guestName,
    p_guest_phone: body.guestPhone,
  }
  if (body.guestEmail) params.p_guest_email = body.guestEmail
  if (body.notes) params.p_notes = body.notes

  const { data, error } = await supabaseAdmin.rpc('create_guest_reservation', params)
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data }, 201)
})

export { pub }
