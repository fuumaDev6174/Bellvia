import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const admin = new Hono()

// All admin routes require authentication
admin.use('*', authMiddleware)

// ---------- Dashboard ----------

// GET /api/admin/dashboard/stats
admin.get('/dashboard/stats', async (c) => {
  const staff = c.get('staff')

  // Get today/weekEnd in JST
  const now = new Date()
  const today = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
  const weekEndDate = new Date(now)
  weekEndDate.setDate(now.getDate() + (7 - now.getDay()))
  const weekEnd = weekEndDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })

  // Run 3 queries in parallel
  const [todayRes, weekRes, customerRes] = await Promise.all([
    // Today's reservations with details
    supabaseAdmin
      .from('reservations')
      .select(`
        *,
        staff:staff_id (display_name, photo_url),
        menu:menu_id (name, price, duration_min, category),
        customer:customer_id (name, phone, email)
      `)
      .eq('store_id', staff.storeId)
      .gte('start_at', `${today}T00:00:00`)
      .lte('start_at', `${today}T23:59:59`)
      .order('start_at', { ascending: true }),

    // Week reservation count
    supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', staff.storeId)
      .gte('start_at', `${today}T00:00:00`)
      .lte('start_at', `${weekEnd}T23:59:59`),

    // Customer count
    supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', staff.companyId),
  ])

  if (todayRes.error) return c.json({ message: todayRes.error.message }, 500)

  return c.json({
    data: {
      todayReservations: todayRes.data ?? [],
      weekCount: weekRes.count ?? 0,
      customerCount: customerRes.count ?? 0,
    },
  })
})

// ---------- Reservations ----------

// GET /api/admin/reservations
admin.get('/reservations', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId') ?? staff.storeId
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const status = c.req.query('status')
  const staffId = c.req.query('staffId')

  let query = supabaseAdmin
    .from('reservations')
    .select(`
      *,
      staff:staff_id (display_name, photo_url),
      menu:menu_id (name, price, duration_min, category),
      customer:customer_id (name, phone, email)
    `)
    .eq('store_id', storeId)
    .order('start_at', { ascending: true })

  if (startDate) query = query.gte('start_at', `${startDate}T00:00:00`)
  if (endDate) query = query.lte('start_at', `${endDate}T23:59:59`)
  if (status) query = query.eq('status', status)
  if (staffId) query = query.eq('staff_id', staffId)

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// POST /api/admin/reservations
admin.post('/reservations', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{
    storeId?: string
    staffId: string
    menuId: string
    startAt: string
    endAt: string
    source?: string
    guestName: string
    guestPhone?: string
    notes?: string
  }>()

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .insert({
      store_id: body.storeId ?? staff.storeId,
      company_id: staff.companyId,
      staff_id: body.staffId,
      menu_id: body.menuId,
      start_at: body.startAt,
      end_at: body.endAt,
      status: 'confirmed',
      source: body.source ?? 'phone',
      guest_name: body.guestName,
      guest_phone: body.guestPhone ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data }, 201)
})

// PATCH /api/admin/reservations/:id
admin.patch('/reservations/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()

  const updateData: Record<string, unknown> = { status: body.status }
  if (body.status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// ---------- Menus ----------

// GET /api/admin/menus
admin.get('/menus', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId') ?? staff.storeId

  const { data, error } = await supabaseAdmin
    .from('menus')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order')

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// POST /api/admin/menus
admin.post('/menus', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{
    name: string
    category?: string
    description?: string
    price: number
    durationMin: number
    isPublic?: boolean
    sortOrder?: number
  }>()

  const { data, error } = await supabaseAdmin
    .from('menus')
    .insert({
      store_id: staff.storeId,
      company_id: staff.companyId,
      name: body.name,
      category: body.category ?? null,
      description: body.description ?? null,
      price: body.price,
      duration_min: body.durationMin,
      is_public: body.isPublic ?? true,
      sort_order: body.sortOrder ?? 0,
    })
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data }, 201)
})

// PATCH /api/admin/menus/:id
admin.patch('/menus/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    category?: string
    description?: string
    price?: number
    durationMin?: number
    isPublic?: boolean
    sortOrder?: number
  }>()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.category !== undefined) updateData.category = body.category
  if (body.description !== undefined) updateData.description = body.description
  if (body.price !== undefined) updateData.price = body.price
  if (body.durationMin !== undefined) updateData.duration_min = body.durationMin
  if (body.isPublic !== undefined) updateData.is_public = body.isPublic
  if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder

  const { data, error } = await supabaseAdmin
    .from('menus')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// DELETE /api/admin/menus/:id
admin.delete('/menus/:id', async (c) => {
  const id = c.req.param('id')

  const { error } = await supabaseAdmin
    .from('menus')
    .delete()
    .eq('id', id)

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: { message: 'Deleted' } })
})

// ---------- Staff ----------

// GET /api/admin/staff
admin.get('/staff', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId') ?? staff.storeId
  const activeOnly = c.req.query('activeOnly') !== 'false'
  const roles = c.req.query('roles') // comma-separated

  let query = supabaseAdmin
    .from('staff')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order')

  if (activeOnly) query = query.eq('is_active', true)
  if (roles) query = query.in('role', roles.split(','))

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// PATCH /api/admin/staff/:id
admin.patch('/staff/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    displayName?: string
    role?: string
    position?: string
    bio?: string
    specialties?: string[]
    isActive?: boolean
  }>()

  const updateData: Record<string, unknown> = {}
  if (body.displayName !== undefined) updateData.display_name = body.displayName
  if (body.role !== undefined) updateData.role = body.role
  if (body.position !== undefined) updateData.position = body.position
  if (body.bio !== undefined) updateData.bio = body.bio
  if (body.specialties !== undefined) updateData.specialties = body.specialties
  if (body.isActive !== undefined) updateData.is_active = body.isActive

  const { data, error } = await supabaseAdmin
    .from('staff')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// ---------- Customers ----------

// GET /api/admin/customers
admin.get('/customers', async (c) => {
  const staff = c.get('staff')
  const search = c.req.query('search')

  let query = supabaseAdmin
    .from('customers')
    .select('*')
    .eq('company_id', staff.companyId)
    .order('last_visit_at', { ascending: false, nullsFirst: false })

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},phone.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/admin/customers/:id/reservations
admin.get('/customers/:id/reservations', async (c) => {
  const customerId = c.req.param('id')

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      staff:staff_id (display_name, photo_url),
      menu:menu_id (name, price, duration_min, category)
    `)
    .eq('customer_id', customerId)
    .order('start_at', { ascending: false })

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

export { admin }
