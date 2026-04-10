import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const admin = new Hono()

// All admin routes require authentication
admin.use('*', authMiddleware)

// ---------- Business Types ----------

// GET /api/admin/business-types
admin.get('/business-types', async (c) => {
  const staff = c.get('staff')

  const { data, error } = await supabaseAdmin
    .from('business_types')
    .select('*')
    .eq('company_id', staff.companyId)
    .order('sort_order')

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// POST /api/admin/business-types
admin.post('/business-types', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ name: string; color?: string; sortOrder?: number }>()

  const { data, error } = await supabaseAdmin
    .from('business_types')
    .insert({
      company_id: staff.companyId,
      name: body.name,
      color: body.color ?? '#6366f1',
      sort_order: body.sortOrder ?? 0,
    })
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data }, 201)
})

// PATCH /api/admin/business-types/:id
admin.patch('/business-types/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; color?: string; sortOrder?: number; isActive?: boolean }>()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.color !== undefined) updateData.color = body.color
  if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder
  if (body.isActive !== undefined) updateData.is_active = body.isActive

  const { data, error } = await supabaseAdmin
    .from('business_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// DELETE /api/admin/business-types/:id
admin.delete('/business-types/:id', async (c) => {
  const id = c.req.param('id')

  // Unlink stores first
  await supabaseAdmin
    .from('stores')
    .update({ business_type_id: null })
    .eq('business_type_id', id)

  const { error } = await supabaseAdmin
    .from('business_types')
    .delete()
    .eq('id', id)

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: { message: 'Deleted' } })
})

// ---------- Stores ----------

// GET /api/admin/stores
admin.get('/stores', async (c) => {
  const staff = c.get('staff')

  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*, business_type:business_type_id (id, name, color)')
    .eq('company_id', staff.companyId)
    .order('name')

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// PATCH /api/admin/stores/:id
admin.patch('/stores/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    slug?: string
    address?: string
    phone?: string
    description?: string
    businessHours?: unknown
    businessTypeId?: string | null
    isActive?: boolean
  }>()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.slug !== undefined) updateData.slug = body.slug
  if (body.address !== undefined) updateData.address = body.address
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.description !== undefined) updateData.description = body.description
  if (body.businessHours !== undefined) updateData.business_hours = body.businessHours
  if (body.businessTypeId !== undefined) updateData.business_type_id = body.businessTypeId
  if (body.isActive !== undefined) updateData.is_active = body.isActive

  const { data, error } = await supabaseAdmin
    .from('stores')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

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
    workloadPoints?: number
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
      workload_points: body.workloadPoints ?? 1.0,
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
    workloadPoints?: number
  }>()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.category !== undefined) updateData.category = body.category
  if (body.description !== undefined) updateData.description = body.description
  if (body.price !== undefined) updateData.price = body.price
  if (body.durationMin !== undefined) updateData.duration_min = body.durationMin
  if (body.isPublic !== undefined) updateData.is_public = body.isPublic
  if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder
  if (body.workloadPoints !== undefined) updateData.workload_points = body.workloadPoints

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

// ---------- Workload ----------

// GET /api/admin/workload
admin.get('/workload', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const staffId = c.req.query('staffId')

  let query = supabaseAdmin
    .from('reservations')
    .select(`
      staff_id,
      staff:staff_id (display_name),
      menu:menu_id (name, workload_points)
    `)
    .eq('company_id', staff.companyId)
    .eq('status', 'completed')

  if (storeId) query = query.eq('store_id', storeId)
  if (staffId) query = query.eq('staff_id', staffId)
  if (startDate) query = query.gte('start_at', `${startDate}T00:00:00`)
  if (endDate) query = query.lte('start_at', `${endDate}T23:59:59`)

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)

  // Aggregate by staff
  const staffMap = new Map<string, {
    staffId: string
    staffName: string
    totalPoints: number
    totalCount: number
    byMenu: Record<string, { count: number; points: number }>
  }>()

  for (const r of data ?? []) {
    const sid = r.staff_id
    const staffRel = r.staff as unknown as { display_name: string } | null
    const menuRel = r.menu as unknown as { name: string; workload_points: number } | null
    const staffName = staffRel?.display_name ?? '-'
    const menuName = menuRel?.name ?? '-'
    const points = menuRel?.workload_points ?? 1.0

    if (!staffMap.has(sid)) {
      staffMap.set(sid, { staffId: sid, staffName, totalPoints: 0, totalCount: 0, byMenu: {} })
    }
    const entry = staffMap.get(sid)!
    entry.totalPoints += points
    entry.totalCount++
    if (!entry.byMenu[menuName]) entry.byMenu[menuName] = { count: 0, points: 0 }
    entry.byMenu[menuName].count++
    entry.byMenu[menuName].points += points
  }

  return c.json({ data: Array.from(staffMap.values()) })
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
  const storeId = c.req.query('storeId')

  if (storeId) {
    // Get customer IDs who have reservations at this store
    const { data: reservations, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('customer_id')
      .eq('store_id', storeId)
      .not('customer_id', 'is', null)

    if (resError) return c.json({ message: resError.message }, 500)

    const customerIds = [...new Set((reservations ?? []).map(r => r.customer_id).filter(Boolean))]
    if (customerIds.length === 0) return c.json({ data: [] })

    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .in('id', customerIds)
      .order('last_visit_at', { ascending: false, nullsFirst: false })

    if (search && search.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(`name.ilike.${term},phone.ilike.${term}`)
    }

    const { data, error } = await query
    if (error) return c.json({ message: error.message }, 500)
    return c.json({ data: data ?? [] })
  }

  // No storeId: return all company customers
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

// ---------- Sales ----------

// GET /api/admin/sales
admin.get('/sales', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  let query = supabaseAdmin
    .from('sales')
    .select(`
      *,
      staff:staff_id (display_name),
      customer:customer_id (name),
      store:store_id (name)
    `)
    .eq('company_id', staff.companyId)
    .order('paid_at', { ascending: false })

  if (storeId) query = query.eq('store_id', storeId)
  if (startDate) query = query.gte('paid_at', `${startDate}T00:00:00`)
  if (endDate) query = query.lte('paid_at', `${endDate}T23:59:59`)

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/admin/sales/summary
admin.get('/sales/summary', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  let query = supabaseAdmin
    .from('sales')
    .select('amount, payment_method, store_id, paid_at')
    .eq('company_id', staff.companyId)

  if (storeId) query = query.eq('store_id', storeId)
  if (startDate) query = query.gte('paid_at', `${startDate}T00:00:00`)
  if (endDate) query = query.lte('paid_at', `${endDate}T23:59:59`)

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)

  const sales = data ?? []
  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0)
  const totalCount = sales.length

  // By payment method
  const byPaymentMethod: Record<string, { count: number; amount: number }> = {}
  for (const s of sales) {
    if (!byPaymentMethod[s.payment_method]) byPaymentMethod[s.payment_method] = { count: 0, amount: 0 }
    byPaymentMethod[s.payment_method].count++
    byPaymentMethod[s.payment_method].amount += s.amount
  }

  // By store
  const byStore: Record<string, { count: number; amount: number }> = {}
  for (const s of sales) {
    if (!byStore[s.store_id]) byStore[s.store_id] = { count: 0, amount: 0 }
    byStore[s.store_id].count++
    byStore[s.store_id].amount += s.amount
  }

  // Fetch store names
  const { data: stores } = await supabaseAdmin
    .from('stores')
    .select('id, name')
    .eq('company_id', staff.companyId)

  const storeMap = Object.fromEntries((stores ?? []).map(s => [s.id, s.name]))
  const byStoreNamed = Object.fromEntries(
    Object.entries(byStore).map(([id, v]) => [storeMap[id] ?? id, v])
  )

  return c.json({
    data: { totalAmount, totalCount, byPaymentMethod, byStore: byStoreNamed },
  })
})

// POST /api/admin/sales/import-paypay
admin.post('/sales/import-paypay', async (c) => {
  const staff = c.get('staff')
  if (staff.role !== 'company_admin' && staff.role !== 'store_manager') {
    return c.json({ message: 'Forbidden' }, 403)
  }

  const body = await c.req.json<{
    storeId: string
    rows: Array<{
      transactionId: string
      amount: number
      paidAt: string
      status: string
    }>
  }>()

  if (!body.storeId || !body.rows || !Array.isArray(body.rows)) {
    return c.json({ message: 'Invalid request body' }, 400)
  }

  // Filter to completed transactions only
  const completedRows = body.rows.filter(
    (r) => r.status === '完了' || r.status === 'completed' || r.status === 'SUCCESS'
  )
  const skipped = body.rows.length - completedRows.length

  if (completedRows.length === 0) {
    return c.json({ data: { imported: 0, skipped, duplicates: 0 } })
  }

  // Check for existing transaction IDs to avoid duplicates
  const txnIds = completedRows.map((r) => r.transactionId)
  const { data: existing } = await supabaseAdmin
    .from('sales')
    .select('paypay_transaction_id')
    .in('paypay_transaction_id', txnIds)

  const existingSet = new Set((existing ?? []).map((e) => e.paypay_transaction_id))
  const newRows = completedRows.filter((r) => !existingSet.has(r.transactionId))
  const duplicates = completedRows.length - newRows.length

  if (newRows.length === 0) {
    return c.json({ data: { imported: 0, skipped, duplicates } })
  }

  const insertData = newRows.map((r) => ({
    store_id: body.storeId,
    company_id: staff.companyId,
    amount: r.amount,
    payment_method: 'paypay',
    paid_at: r.paidAt,
    paypay_transaction_id: r.transactionId,
  }))

  const { error } = await supabaseAdmin.from('sales').insert(insertData)
  if (error) return c.json({ message: error.message }, 500)

  return c.json({ data: { imported: newRows.length, skipped, duplicates } })
})

// ---------- Inventory ----------

// GET /api/admin/inventory/items
admin.get('/inventory/items', async (c) => {
  const staff = c.get('staff')

  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .eq('company_id', staff.companyId)
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/admin/inventory/stock
admin.get('/inventory/stock', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')

  let query = supabaseAdmin
    .from('inventory_stock')
    .select(`
      *,
      item:item_id (name, category, unit, cost_price, selling_price),
      store:store_id (name)
    `)
    .eq('company_id', staff.companyId)

  if (storeId) query = query.eq('store_id', storeId)

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// PATCH /api/admin/inventory/stock/:id
admin.patch('/inventory/stock/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ quantity?: number; minQuantity?: number }>()

  const updateData: Record<string, unknown> = {}
  if (body.quantity !== undefined) updateData.quantity = body.quantity
  if (body.minQuantity !== undefined) updateData.min_quantity = body.minQuantity

  const { data, error } = await supabaseAdmin
    .from('inventory_stock')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// ---------- Attendances ----------

// GET /api/admin/attendances/my-status
admin.get('/attendances/my-status', async (c) => {
  const staff = c.get('staff')

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('staff_id', staff.id)
    .eq('status', 'clocked_in')
    .maybeSingle()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// POST /api/admin/attendances/clock-in
admin.post('/attendances/clock-in', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ note?: string }>().catch(() => ({ note: undefined }))

  // Check if already clocked in
  const { data: existing } = await supabaseAdmin
    .from('attendances')
    .select('id')
    .eq('staff_id', staff.id)
    .eq('status', 'clocked_in')
    .maybeSingle()

  if (existing) {
    return c.json({ message: 'すでに出勤中です' }, 400)
  }

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .insert({
      staff_id: staff.id,
      store_id: staff.storeId,
      company_id: staff.companyId,
      clock_in: new Date().toISOString(),
      clock_in_note: body.note ?? null,
      status: 'clocked_in',
    })
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data }, 201)
})

// POST /api/admin/attendances/clock-out
admin.post('/attendances/clock-out', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ note?: string }>().catch(() => ({ note: undefined }))

  const { data: existing, error: findError } = await supabaseAdmin
    .from('attendances')
    .select('id')
    .eq('staff_id', staff.id)
    .eq('status', 'clocked_in')
    .maybeSingle()

  if (findError) return c.json({ message: findError.message }, 500)
  if (!existing) {
    return c.json({ message: '出勤記録がありません' }, 400)
  }

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .update({
      clock_out: new Date().toISOString(),
      clock_out_note: body.note ?? null,
      status: 'completed',
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

// GET /api/admin/attendances
admin.get('/attendances', async (c) => {
  const staff = c.get('staff')
  if (staff.role !== 'company_admin' && staff.role !== 'store_manager') {
    return c.json({ message: 'Forbidden' }, 403)
  }

  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const staffId = c.req.query('staffId')

  let query = supabaseAdmin
    .from('attendances')
    .select(`
      *,
      staff:staff_id (display_name),
      corrector:corrected_by (display_name)
    `)
    .eq('company_id', staff.companyId)
    .order('clock_in', { ascending: false })

  if (storeId) query = query.eq('store_id', storeId)
  if (staffId) query = query.eq('staff_id', staffId)
  if (startDate) query = query.gte('clock_in', `${startDate}T00:00:00`)
  if (endDate) query = query.lte('clock_in', `${endDate}T23:59:59`)

  const { data, error } = await query
  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// PATCH /api/admin/attendances/:id
admin.patch('/attendances/:id', async (c) => {
  const staff = c.get('staff')
  if (staff.role !== 'company_admin' && staff.role !== 'store_manager') {
    return c.json({ message: 'Forbidden' }, 403)
  }

  const id = c.req.param('id')
  const body = await c.req.json<{
    clockIn?: string
    clockOut?: string
    clockInNote?: string
    clockOutNote?: string
    correctionReason: string
  }>()

  if (!body.correctionReason) {
    return c.json({ message: '修正理由は必須です' }, 400)
  }

  const updateData: Record<string, unknown> = {
    status: 'corrected',
    corrected_by: staff.id,
    correction_reason: body.correctionReason,
  }
  if (body.clockIn !== undefined) updateData.clock_in = body.clockIn
  if (body.clockOut !== undefined) updateData.clock_out = body.clockOut
  if (body.clockInNote !== undefined) updateData.clock_in_note = body.clockInNote
  if (body.clockOutNote !== undefined) updateData.clock_out_note = body.clockOutNote

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ message: error.message }, 500)
  return c.json({ data })
})

export { admin }
