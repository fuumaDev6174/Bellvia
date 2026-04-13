import { Hono } from 'hono'
import { db } from '../db/index.js'
import { eq, and, sql, desc, asc, inArray, ilike, or, count, gte, lte } from 'drizzle-orm'
import * as schema from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

const admin = new Hono()

// All admin routes require authentication
admin.use('*', authMiddleware)

// ---------- Business Types ----------

// GET /api/admin/business-types
admin.get('/business-types', async (c) => {
  const staff = c.get('staff')

  try {
    const data = await db
      .select()
      .from(schema.businessTypes)
      .where(eq(schema.businessTypes.companyId, staff.companyId))
      .orderBy(asc(schema.businessTypes.sortOrder))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// POST /api/admin/business-types
admin.post('/business-types', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ name: string; color?: string; sortOrder?: number }>()

  try {
    const [data] = await db
      .insert(schema.businessTypes)
      .values({
        companyId: staff.companyId,
        name: body.name,
        color: body.color ?? '#6366f1',
        sortOrder: body.sortOrder ?? 0,
      })
      .returning()

    return c.json({ data }, 201)
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// PATCH /api/admin/business-types/:id
admin.patch('/business-types/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; color?: string; sortOrder?: number; isActive?: boolean }>()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.color !== undefined) updateData.color = body.color
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
  if (body.isActive !== undefined) updateData.isActive = body.isActive

  try {
    const [data] = await db
      .update(schema.businessTypes)
      .set(updateData)
      .where(and(eq(schema.businessTypes.id, id), eq(schema.businessTypes.companyId, staff.companyId)))
      .returning()

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// DELETE /api/admin/business-types/:id
admin.delete('/business-types/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')

  try {
    // Unlink stores first
    await db
      .update(schema.stores)
      .set({ businessTypeId: null })
      .where(and(eq(schema.stores.businessTypeId, id), eq(schema.stores.companyId, staff.companyId)))

    await db
      .delete(schema.businessTypes)
      .where(and(eq(schema.businessTypes.id, id), eq(schema.businessTypes.companyId, staff.companyId)))

    return c.json({ data: { message: 'Deleted' } })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Stores ----------

// GET /api/admin/stores
admin.get('/stores', async (c) => {
  const staff = c.get('staff')

  try {
    const storesData = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.companyId, staff.companyId))
      .orderBy(asc(schema.stores.name))

    // Fetch business types and business hours for all stores
    const storeIds = storesData.map(s => s.id)

    const [businessTypesData, businessHoursData] = await Promise.all([
      db.select().from(schema.businessTypes).where(eq(schema.businessTypes.companyId, staff.companyId)),
      storeIds.length > 0
        ? db.select().from(schema.storeBusinessHours).where(inArray(schema.storeBusinessHours.storeId, storeIds))
        : Promise.resolve([]),
    ])

    const btMap = new Map(businessTypesData.map(bt => [bt.id, bt]))

    const data = storesData.map(store => ({
      ...store,
      business_type: store.businessTypeId ? btMap.get(store.businessTypeId) ?? null : null,
      business_hours: businessHoursData.filter(bh => bh.storeId === store.id),
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// PATCH /api/admin/stores/:id
admin.patch('/stores/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    slug?: string
    address?: string
    phone?: string
    description?: string
    businessHours?: Array<{ day_of_week: number; open_time: string; close_time: string }>
    businessTypeId?: string | null
    isActive?: boolean
  }>()

  try {
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.address !== undefined) updateData.address = body.address
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.description !== undefined) updateData.description = body.description
    if (body.businessTypeId !== undefined) updateData.businessTypeId = body.businessTypeId
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // Update store fields
    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.stores)
        .set(updateData)
        .where(and(eq(schema.stores.id, id), eq(schema.stores.companyId, staff.companyId)))
    }

    // Update business hours (replace all) — only if store belongs to company
    if (body.businessHours !== undefined) {
      await db.delete(schema.storeBusinessHours).where(eq(schema.storeBusinessHours.storeId, id))
      if (body.businessHours.length > 0) {
        await db.insert(schema.storeBusinessHours).values(
          body.businessHours.map(h => ({
            storeId: id,
            dayOfWeek: h.day_of_week,
            openTime: h.open_time,
            closeTime: h.close_time,
          }))
        )
      }
    }

    // Return updated store with business hours
    const [storeData] = await db.select().from(schema.stores).where(and(eq(schema.stores.id, id), eq(schema.stores.companyId, staff.companyId)))
    if (!storeData) return c.json({ message: 'Store not found' }, 404)
    const businessHours = await db.select().from(schema.storeBusinessHours).where(eq(schema.storeBusinessHours.storeId, id))

    const data = { ...storeData, business_hours: businessHours }
    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
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

  try {
    // Run 3 queries in parallel
    const [todayReservationsRaw, weekCountResult, customerCountResult] = await Promise.all([
      // Today's reservations
      db
        .select()
        .from(schema.reservations)
        .where(
          and(
            eq(schema.reservations.storeId, staff.storeId),
            gte(schema.reservations.startAt, new Date(`${today}T00:00:00`)),
            lte(schema.reservations.startAt, new Date(`${today}T23:59:59`))
          )
        )
        .orderBy(asc(schema.reservations.startAt)),

      // Week reservation count
      db
        .select({ count: count() })
        .from(schema.reservations)
        .where(
          and(
            eq(schema.reservations.storeId, staff.storeId),
            gte(schema.reservations.startAt, new Date(`${today}T00:00:00`)),
            lte(schema.reservations.startAt, new Date(`${weekEnd}T23:59:59`))
          )
        ),

      // Customer count
      db
        .select({ count: count() })
        .from(schema.customers)
        .where(eq(schema.customers.companyId, staff.companyId)),
    ])

    // Enrich today's reservations with staff, menu, customer data
    const staffIds = [...new Set(todayReservationsRaw.map(r => r.staffId).filter(Boolean))]
    const menuIds = [...new Set(todayReservationsRaw.map(r => r.menuId).filter(Boolean))]
    const customerIds = [...new Set(todayReservationsRaw.map(r => r.customerId).filter(Boolean))] as string[]

    const [staffData, menuData, categoryData, customerData] = await Promise.all([
      staffIds.length > 0
        ? db.select({ id: schema.staff.id, displayName: schema.staff.displayName, photoUrl: schema.staff.photoUrl }).from(schema.staff).where(inArray(schema.staff.id, staffIds))
        : Promise.resolve([]),
      menuIds.length > 0
        ? db.select({ id: schema.menus.id, name: schema.menus.name, price: schema.menus.price, durationMin: schema.menus.durationMin, categoryId: schema.menus.categoryId }).from(schema.menus).where(inArray(schema.menus.id, menuIds))
        : Promise.resolve([]),
      db.select().from(schema.menuCategories).where(eq(schema.menuCategories.companyId, staff.companyId)),
      customerIds.length > 0
        ? db.select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone, email: schema.customers.email }).from(schema.customers).where(inArray(schema.customers.id, customerIds))
        : Promise.resolve([]),
    ])

    const staffMap = new Map(staffData.map(s => [s.id, { display_name: s.displayName, photo_url: s.photoUrl }]))
    const categoryMap = new Map(categoryData.map(cat => [cat.id, { name: cat.name }]))
    const menuMap = new Map(menuData.map(m => [m.id, {
      name: m.name,
      price: m.price,
      duration_min: m.durationMin,
      category: m.categoryId ? categoryMap.get(m.categoryId) ?? null : null,
    }]))
    const customerMap = new Map(customerData.map(cust => [cust.id, { name: cust.name, phone: cust.phone, email: cust.email }]))

    const todayReservations = todayReservationsRaw.map(r => ({
      ...r,
      staff: staffMap.get(r.staffId) ?? null,
      menu: menuMap.get(r.menuId) ?? null,
      customer: r.customerId ? customerMap.get(r.customerId) ?? null : null,
    }))

    return c.json({
      data: {
        todayReservations,
        weekCount: weekCountResult[0]?.count ?? 0,
        customerCount: customerCountResult[0]?.count ?? 0,
      },
    })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Reservations ----------

// GET /api/admin/reservations
admin.get('/reservations', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId') ?? staff.storeId
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const status = c.req.query('status')
  const staffIdFilter = c.req.query('staffId')

  try {
    const conditions = [eq(schema.reservations.storeId, storeId)]
    if (startDate) conditions.push(gte(schema.reservations.startAt, new Date(`${startDate}T00:00:00`)))
    if (endDate) conditions.push(lte(schema.reservations.startAt, new Date(`${endDate}T23:59:59`)))
    if (status) conditions.push(eq(schema.reservations.status, status))
    if (staffIdFilter) conditions.push(eq(schema.reservations.staffId, staffIdFilter))

    const reservationsRaw = await db
      .select()
      .from(schema.reservations)
      .where(and(...conditions))
      .orderBy(asc(schema.reservations.startAt))

    // Enrich with related data
    const staffIds = [...new Set(reservationsRaw.map(r => r.staffId).filter(Boolean))]
    const menuIds = [...new Set(reservationsRaw.map(r => r.menuId).filter(Boolean))]
    const customerIds = [...new Set(reservationsRaw.map(r => r.customerId).filter(Boolean))] as string[]

    const [staffData, menuData, categoryData, customerData] = await Promise.all([
      staffIds.length > 0
        ? db.select({ id: schema.staff.id, displayName: schema.staff.displayName, photoUrl: schema.staff.photoUrl }).from(schema.staff).where(inArray(schema.staff.id, staffIds))
        : Promise.resolve([]),
      menuIds.length > 0
        ? db.select({ id: schema.menus.id, name: schema.menus.name, price: schema.menus.price, durationMin: schema.menus.durationMin, categoryId: schema.menus.categoryId }).from(schema.menus).where(inArray(schema.menus.id, menuIds))
        : Promise.resolve([]),
      db.select().from(schema.menuCategories).where(eq(schema.menuCategories.companyId, staff.companyId)),
      customerIds.length > 0
        ? db.select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone, email: schema.customers.email }).from(schema.customers).where(inArray(schema.customers.id, customerIds))
        : Promise.resolve([]),
    ])

    const staffMap = new Map(staffData.map(s => [s.id, { display_name: s.displayName, photo_url: s.photoUrl }]))
    const categoryMap = new Map(categoryData.map(cat => [cat.id, { name: cat.name }]))
    const menuMap = new Map(menuData.map(m => [m.id, {
      name: m.name,
      price: m.price,
      duration_min: m.durationMin,
      category: m.categoryId ? categoryMap.get(m.categoryId) ?? null : null,
    }]))
    const customerMap = new Map(customerData.map(cust => [cust.id, { name: cust.name, phone: cust.phone, email: cust.email }]))

    const data = reservationsRaw.map(r => ({
      ...r,
      staff: staffMap.get(r.staffId) ?? null,
      menu: menuMap.get(r.menuId) ?? null,
      customer: r.customerId ? customerMap.get(r.customerId) ?? null : null,
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
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

  try {
    const [data] = await db
      .insert(schema.reservations)
      .values({
        storeId: body.storeId ?? staff.storeId,
        companyId: staff.companyId,
        staffId: body.staffId,
        menuId: body.menuId,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        status: 'confirmed',
        source: body.source ?? 'phone',
        guestName: body.guestName,
        guestPhone: body.guestPhone ?? null,
        notes: body.notes ?? null,
      })
      .returning()

    return c.json({ data }, 201)
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// PATCH /api/admin/reservations/:id
admin.patch('/reservations/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()

  try {
    const updateData: Record<string, unknown> = { status: body.status }
    if (body.status === 'cancelled') {
      updateData.cancelledAt = new Date()
    }

    const [data] = await db
      .update(schema.reservations)
      .set(updateData)
      .where(and(eq(schema.reservations.id, id), eq(schema.reservations.companyId, staff.companyId)))
      .returning()

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Menu Categories ----------

// GET /api/admin/menu-categories
admin.get('/menu-categories', async (c) => {
  const staff = c.get('staff')

  try {
    const data = await db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.companyId, staff.companyId))
      .orderBy(asc(schema.menuCategories.sortOrder))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// POST /api/admin/menu-categories
admin.post('/menu-categories', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ name: string; sortOrder?: number }>()

  try {
    const [data] = await db
      .insert(schema.menuCategories)
      .values({
        companyId: staff.companyId,
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning()

    return c.json({ data }, 201)
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Menus ----------

// GET /api/admin/menus
admin.get('/menus', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId') ?? staff.storeId

  try {
    const menusRaw = await db
      .select()
      .from(schema.menus)
      .where(eq(schema.menus.storeId, storeId))
      .orderBy(asc(schema.menus.sortOrder))

    // Fetch categories
    const categoryIds = [...new Set(menusRaw.map(m => m.categoryId).filter(Boolean))] as string[]
    const categories = categoryIds.length > 0
      ? await db.select().from(schema.menuCategories).where(inArray(schema.menuCategories.id, categoryIds))
      : []
    const categoryMap = new Map(categories.map(cat => [cat.id, { id: cat.id, name: cat.name }]))

    const data = menusRaw.map(m => ({
      ...m,
      workload_points: Number(m.workloadPoints),
      category: m.categoryId ? categoryMap.get(m.categoryId) ?? null : null,
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// POST /api/admin/menus
admin.post('/menus', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{
    name: string
    categoryId?: string | null
    description?: string
    price: number
    durationMin: number
    isPublic?: boolean
    sortOrder?: number
    workloadPoints?: number
  }>()

  try {
    const [inserted] = await db
      .insert(schema.menus)
      .values({
        storeId: staff.storeId,
        companyId: staff.companyId,
        name: body.name,
        categoryId: body.categoryId ?? null,
        description: body.description ?? null,
        price: body.price,
        durationMin: body.durationMin,
        isPublic: body.isPublic ?? true,
        sortOrder: body.sortOrder ?? 0,
        workloadPoints: String(body.workloadPoints ?? 1.0),
      })
      .returning()

    // Fetch category for response
    let category = null
    if (inserted.categoryId) {
      const [cat] = await db.select().from(schema.menuCategories).where(eq(schema.menuCategories.id, inserted.categoryId))
      if (cat) category = { id: cat.id, name: cat.name }
    }

    const data = { ...inserted, workload_points: Number(inserted.workloadPoints), category }
    return c.json({ data }, 201)
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// PATCH /api/admin/menus/:id
admin.patch('/menus/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    categoryId?: string | null
    description?: string
    price?: number
    durationMin?: number
    isPublic?: boolean
    sortOrder?: number
    workloadPoints?: number
  }>()

  try {
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = body.price
    if (body.durationMin !== undefined) updateData.durationMin = body.durationMin
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.workloadPoints !== undefined) updateData.workloadPoints = String(body.workloadPoints)

    const staff = c.get('staff')
    const [updated] = await db
      .update(schema.menus)
      .set(updateData)
      .where(and(eq(schema.menus.id, id), eq(schema.menus.companyId, staff.companyId)))
      .returning()

    // Fetch category for response
    let category = null
    if (updated.categoryId) {
      const [cat] = await db.select().from(schema.menuCategories).where(eq(schema.menuCategories.id, updated.categoryId))
      if (cat) category = { id: cat.id, name: cat.name }
    }

    const data = { ...updated, workload_points: Number(updated.workloadPoints), category }
    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// DELETE /api/admin/menus/:id
admin.delete('/menus/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')

  try {
    await db.delete(schema.menus).where(and(eq(schema.menus.id, id), eq(schema.menus.companyId, staff.companyId)))
    return c.json({ data: { message: 'Deleted' } })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Workload ----------

// GET /api/admin/workload
admin.get('/workload', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const staffIdFilter = c.req.query('staffId')

  try {
    const conditions = [
      eq(schema.reservations.companyId, staff.companyId),
      eq(schema.reservations.status, 'completed'),
    ]
    if (storeId) conditions.push(eq(schema.reservations.storeId, storeId))
    if (staffIdFilter) conditions.push(eq(schema.reservations.staffId, staffIdFilter))
    if (startDate) conditions.push(gte(schema.reservations.startAt, new Date(`${startDate}T00:00:00`)))
    if (endDate) conditions.push(lte(schema.reservations.startAt, new Date(`${endDate}T23:59:59`)))

    const reservationsRaw = await db
      .select({
        staffId: schema.reservations.staffId,
        menuId: schema.reservations.menuId,
      })
      .from(schema.reservations)
      .where(and(...conditions))

    // Fetch staff and menu data
    const staffIds = [...new Set(reservationsRaw.map(r => r.staffId).filter(Boolean))]
    const menuIds = [...new Set(reservationsRaw.map(r => r.menuId).filter(Boolean))]

    const [staffData, menuData] = await Promise.all([
      staffIds.length > 0
        ? db.select({ id: schema.staff.id, displayName: schema.staff.displayName }).from(schema.staff).where(inArray(schema.staff.id, staffIds))
        : Promise.resolve([]),
      menuIds.length > 0
        ? db.select({ id: schema.menus.id, name: schema.menus.name, workloadPoints: schema.menus.workloadPoints }).from(schema.menus).where(inArray(schema.menus.id, menuIds))
        : Promise.resolve([]),
    ])

    const staffMap = new Map(staffData.map(s => [s.id, s.displayName]))
    const menuMap = new Map(menuData.map(m => [m.id, { name: m.name, workloadPoints: Number(m.workloadPoints) }]))

    // Aggregate by staff
    const staffAggMap = new Map<string, {
      staffId: string
      staffName: string
      totalPoints: number
      totalCount: number
      byMenu: Record<string, { count: number; points: number }>
    }>()

    for (const r of reservationsRaw) {
      const sid = r.staffId
      const staffName = staffMap.get(sid) ?? '-'
      const menu = menuMap.get(r.menuId)
      const menuName = menu?.name ?? '-'
      const points = menu?.workloadPoints ?? 1.0

      if (!staffAggMap.has(sid)) {
        staffAggMap.set(sid, { staffId: sid, staffName, totalPoints: 0, totalCount: 0, byMenu: {} })
      }
      const entry = staffAggMap.get(sid)!
      entry.totalPoints += points
      entry.totalCount++
      if (!entry.byMenu[menuName]) entry.byMenu[menuName] = { count: 0, points: 0 }
      entry.byMenu[menuName].count++
      entry.byMenu[menuName].points += points
    }

    return c.json({ data: Array.from(staffAggMap.values()) })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Staff ----------

// GET /api/admin/staff
admin.get('/staff', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId') ?? staff.storeId
  const activeOnly = c.req.query('activeOnly') !== 'false'
  const roles = c.req.query('roles') // comma-separated

  try {
    const conditions = [eq(schema.staff.storeId, storeId)]
    if (activeOnly) conditions.push(eq(schema.staff.isActive, true))
    if (roles) conditions.push(inArray(schema.staff.role, roles.split(',')))

    const staffData = await db
      .select()
      .from(schema.staff)
      .where(and(...conditions))
      .orderBy(asc(schema.staff.sortOrder))

    // Fetch specialties for all staff
    const staffIds = staffData.map(s => s.id)
    const specialtiesData = staffIds.length > 0
      ? await db.select().from(schema.staffSpecialties).where(inArray(schema.staffSpecialties.staffId, staffIds))
      : []

    const specialtiesMap = new Map<string, string[]>()
    for (const sp of specialtiesData) {
      if (!specialtiesMap.has(sp.staffId)) specialtiesMap.set(sp.staffId, [])
      specialtiesMap.get(sp.staffId)!.push(sp.specialty)
    }

    const data = staffData.map(s => ({
      ...s,
      specialties: specialtiesMap.get(s.id) ?? [],
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// PATCH /api/admin/staff/:id
admin.patch('/staff/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')
  const body = await c.req.json<{
    displayName?: string
    role?: string
    position?: string
    bio?: string
    specialties?: string[]
    isActive?: boolean
  }>()

  try {
    const updateData: Record<string, unknown> = {}
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.role !== undefined) updateData.role = body.role
    if (body.position !== undefined) updateData.position = body.position
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    if (Object.keys(updateData).length > 0) {
      await db.update(schema.staff).set(updateData).where(and(eq(schema.staff.id, id), eq(schema.staff.companyId, staff.companyId)))
    }

    // Update specialties (replace all)
    if (body.specialties !== undefined) {
      await db.delete(schema.staffSpecialties).where(eq(schema.staffSpecialties.staffId, id))
      if (body.specialties.length > 0) {
        await db.insert(schema.staffSpecialties).values(
          body.specialties.map(s => ({ staffId: id, specialty: s }))
        )
      }
    }

    // Return updated staff with specialties
    const [staffData] = await db.select().from(schema.staff).where(eq(schema.staff.id, id))
    const specialtiesData = await db.select().from(schema.staffSpecialties).where(eq(schema.staffSpecialties.staffId, id))

    const data = {
      ...staffData,
      specialties: specialtiesData.map(sp => sp.specialty),
    }
    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Customers ----------

// GET /api/admin/customers
admin.get('/customers', async (c) => {
  const staff = c.get('staff')
  const search = c.req.query('search')
  const storeId = c.req.query('storeId')

  try {
    if (storeId) {
      // Get customer IDs who have reservations at this store
      const reservationsWithCustomer = await db
        .select({ customerId: schema.reservations.customerId })
        .from(schema.reservations)
        .where(
          and(
            eq(schema.reservations.storeId, storeId),
            sql`${schema.reservations.customerId} IS NOT NULL`
          )
        )

      const customerIds = [...new Set(reservationsWithCustomer.map(r => r.customerId).filter(Boolean))] as string[]
      if (customerIds.length === 0) return c.json({ data: [] })

      const conditions = [inArray(schema.customers.id, customerIds)]
      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        conditions.push(
          or(
            ilike(schema.customers.name, term),
            ilike(schema.customers.phone ?? '', term)
          )!
        )
      }

      const customersData = await db
        .select()
        .from(schema.customers)
        .where(and(...conditions))

      // Fetch customer stats from view
      const statsResult = await db.execute(
        sql`SELECT customer_id, visit_count, first_visit_at, last_visit_at FROM customer_stats WHERE customer_id = ANY(${customerIds})`
      )
      const statsRows = (statsResult as unknown as { rows: Array<{ customer_id: string; visit_count: number; first_visit_at: string | null; last_visit_at: string | null }> }).rows ?? statsResult

      const statsMap = new Map<string, { visit_count: number; first_visit_at: string | null; last_visit_at: string | null }>()
      for (const row of statsRows as Array<{ customer_id: string; visit_count: number; first_visit_at: string | null; last_visit_at: string | null }>) {
        statsMap.set(row.customer_id, { visit_count: row.visit_count, first_visit_at: row.first_visit_at, last_visit_at: row.last_visit_at })
      }

      const result = customersData.map(cust => {
        const s = statsMap.get(cust.id)
        return { ...cust, visit_count: s?.visit_count ?? 0, first_visit_at: s?.first_visit_at ?? null, last_visit_at: s?.last_visit_at ?? null }
      }).sort((a, b) => {
        if (!a.last_visit_at && !b.last_visit_at) return 0
        if (!a.last_visit_at) return 1
        if (!b.last_visit_at) return -1
        return String(b.last_visit_at).localeCompare(String(a.last_visit_at))
      })

      return c.json({ data: result })
    }

    // No storeId: return all company customers
    const conditions = [eq(schema.customers.companyId, staff.companyId)]
    if (search && search.trim()) {
      const term = `%${search.trim()}%`
      conditions.push(
        or(
          ilike(schema.customers.name, term),
          ilike(schema.customers.phone ?? '', term)
        )!
      )
    }

    const customersData = await db
      .select()
      .from(schema.customers)
      .where(and(...conditions))

    // Fetch customer stats from view
    const allCustomerIds = customersData.map(c => c.id)
    let statsMap = new Map<string, { visit_count: number; first_visit_at: string | null; last_visit_at: string | null }>()

    if (allCustomerIds.length > 0) {
      const statsResult = await db.execute(
        sql`SELECT customer_id, visit_count, first_visit_at, last_visit_at FROM customer_stats WHERE customer_id = ANY(${allCustomerIds})`
      )
      const statsRows = (statsResult as unknown as { rows: Array<{ customer_id: string; visit_count: number; first_visit_at: string | null; last_visit_at: string | null }> }).rows ?? statsResult

      for (const row of statsRows as Array<{ customer_id: string; visit_count: number; first_visit_at: string | null; last_visit_at: string | null }>) {
        statsMap.set(row.customer_id, { visit_count: row.visit_count, first_visit_at: row.first_visit_at, last_visit_at: row.last_visit_at })
      }
    }

    const result = customersData.map(cust => {
      const s = statsMap.get(cust.id)
      return { ...cust, visit_count: s?.visit_count ?? 0, first_visit_at: s?.first_visit_at ?? null, last_visit_at: s?.last_visit_at ?? null }
    }).sort((a, b) => {
      if (!a.last_visit_at && !b.last_visit_at) return 0
      if (!a.last_visit_at) return 1
      if (!b.last_visit_at) return -1
      return String(b.last_visit_at).localeCompare(String(a.last_visit_at))
    })

    return c.json({ data: result })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// GET /api/admin/customers/:id/reservations
admin.get('/customers/:id/reservations', async (c) => {
  const customerId = c.req.param('id')
  const staff = c.get('staff')

  try {
    const reservationsRaw = await db
      .select()
      .from(schema.reservations)
      .where(eq(schema.reservations.customerId, customerId))
      .orderBy(desc(schema.reservations.startAt))

    // Enrich with related data
    const staffIds = [...new Set(reservationsRaw.map(r => r.staffId).filter(Boolean))]
    const menuIds = [...new Set(reservationsRaw.map(r => r.menuId).filter(Boolean))]

    const [staffData, menuData, categoryData] = await Promise.all([
      staffIds.length > 0
        ? db.select({ id: schema.staff.id, displayName: schema.staff.displayName, photoUrl: schema.staff.photoUrl }).from(schema.staff).where(inArray(schema.staff.id, staffIds))
        : Promise.resolve([]),
      menuIds.length > 0
        ? db.select({ id: schema.menus.id, name: schema.menus.name, price: schema.menus.price, durationMin: schema.menus.durationMin, categoryId: schema.menus.categoryId }).from(schema.menus).where(inArray(schema.menus.id, menuIds))
        : Promise.resolve([]),
      db.select().from(schema.menuCategories).where(eq(schema.menuCategories.companyId, staff.companyId)),
    ])

    const staffMap = new Map(staffData.map(s => [s.id, { display_name: s.displayName, photo_url: s.photoUrl }]))
    const categoryMap = new Map(categoryData.map(cat => [cat.id, { name: cat.name }]))
    const menuMap = new Map(menuData.map(m => [m.id, {
      name: m.name,
      price: m.price,
      duration_min: m.durationMin,
      category: m.categoryId ? categoryMap.get(m.categoryId) ?? null : null,
    }]))

    const data = reservationsRaw.map(r => ({
      ...r,
      staff: staffMap.get(r.staffId) ?? null,
      menu: menuMap.get(r.menuId) ?? null,
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Sales ----------

// GET /api/admin/sales
admin.get('/sales', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  try {
    const conditions = [eq(schema.sales.companyId, staff.companyId)]
    if (storeId) conditions.push(eq(schema.sales.storeId, storeId))
    if (startDate) conditions.push(gte(schema.sales.paidAt, new Date(`${startDate}T00:00:00`)))
    if (endDate) conditions.push(lte(schema.sales.paidAt, new Date(`${endDate}T23:59:59`)))

    const salesRaw = await db
      .select()
      .from(schema.sales)
      .where(and(...conditions))
      .orderBy(desc(schema.sales.paidAt))

    // Enrich with related data
    const staffIds = [...new Set(salesRaw.map(s => s.staffId).filter(Boolean))] as string[]
    const customerIds = [...new Set(salesRaw.map(s => s.customerId).filter(Boolean))] as string[]
    const storeIds = [...new Set(salesRaw.map(s => s.storeId).filter(Boolean))]

    const [staffData, customerData, storesData] = await Promise.all([
      staffIds.length > 0
        ? db.select({ id: schema.staff.id, displayName: schema.staff.displayName }).from(schema.staff).where(inArray(schema.staff.id, staffIds))
        : Promise.resolve([]),
      customerIds.length > 0
        ? db.select({ id: schema.customers.id, name: schema.customers.name }).from(schema.customers).where(inArray(schema.customers.id, customerIds))
        : Promise.resolve([]),
      storeIds.length > 0
        ? db.select({ id: schema.stores.id, name: schema.stores.name }).from(schema.stores).where(inArray(schema.stores.id, storeIds))
        : Promise.resolve([]),
    ])

    const staffMap = new Map(staffData.map(s => [s.id, { display_name: s.displayName }]))
    const customerMap = new Map(customerData.map(c => [c.id, { name: c.name }]))
    const storeMap = new Map(storesData.map(s => [s.id, { name: s.name }]))

    const data = salesRaw.map(s => ({
      ...s,
      staff: s.staffId ? staffMap.get(s.staffId) ?? null : null,
      customer: s.customerId ? customerMap.get(s.customerId) ?? null : null,
      store: storeMap.get(s.storeId) ?? null,
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// GET /api/admin/sales/summary
admin.get('/sales/summary', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  try {
    const conditions = [eq(schema.sales.companyId, staff.companyId)]
    if (storeId) conditions.push(eq(schema.sales.storeId, storeId))
    if (startDate) conditions.push(gte(schema.sales.paidAt, new Date(`${startDate}T00:00:00`)))
    if (endDate) conditions.push(lte(schema.sales.paidAt, new Date(`${endDate}T23:59:59`)))

    const salesData = await db
      .select({
        amount: schema.sales.amount,
        paymentMethod: schema.sales.paymentMethod,
        storeId: schema.sales.storeId,
        paidAt: schema.sales.paidAt,
      })
      .from(schema.sales)
      .where(and(...conditions))

    const totalAmount = salesData.reduce((sum, s) => sum + s.amount, 0)
    const totalCount = salesData.length

    // By payment method
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {}
    for (const s of salesData) {
      if (!byPaymentMethod[s.paymentMethod]) byPaymentMethod[s.paymentMethod] = { count: 0, amount: 0 }
      byPaymentMethod[s.paymentMethod].count++
      byPaymentMethod[s.paymentMethod].amount += s.amount
    }

    // By store
    const byStore: Record<string, { count: number; amount: number }> = {}
    for (const s of salesData) {
      if (!byStore[s.storeId]) byStore[s.storeId] = { count: 0, amount: 0 }
      byStore[s.storeId].count++
      byStore[s.storeId].amount += s.amount
    }

    // Fetch store names
    const storesData = await db
      .select({ id: schema.stores.id, name: schema.stores.name })
      .from(schema.stores)
      .where(eq(schema.stores.companyId, staff.companyId))

    const storeNameMap = Object.fromEntries(storesData.map(s => [s.id, s.name]))
    const byStoreNamed = Object.fromEntries(
      Object.entries(byStore).map(([id, v]) => [storeNameMap[id] ?? id, v])
    )

    return c.json({
      data: { totalAmount, totalCount, byPaymentMethod, byStore: byStoreNamed },
    })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
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

  // Verify storeId belongs to staff's company
  const [targetStore] = await db
    .select({ id: schema.stores.id })
    .from(schema.stores)
    .where(and(eq(schema.stores.id, body.storeId), eq(schema.stores.companyId, staff.companyId)))
    .limit(1)

  if (!targetStore) {
    return c.json({ message: 'Store not found' }, 404)
  }

  // Filter to completed transactions only
  const completedRows = body.rows.filter(
    (r) => r.status === '完了' || r.status === 'completed' || r.status === 'SUCCESS'
  )
  const skipped = body.rows.length - completedRows.length

  if (completedRows.length === 0) {
    return c.json({ data: { imported: 0, skipped, duplicates: 0 } })
  }

  try {
    // Check for existing transaction IDs to avoid duplicates
    const txnIds = completedRows.map((r) => r.transactionId)
    const existing = await db
      .select({ paypayTransactionId: schema.sales.paypayTransactionId })
      .from(schema.sales)
      .where(inArray(schema.sales.paypayTransactionId, txnIds))

    const existingSet = new Set(existing.map((e) => e.paypayTransactionId))
    const newRows = completedRows.filter((r) => !existingSet.has(r.transactionId))
    const duplicates = completedRows.length - newRows.length

    if (newRows.length === 0) {
      return c.json({ data: { imported: 0, skipped, duplicates } })
    }

    const insertData = newRows.map((r) => ({
      storeId: body.storeId,
      companyId: staff.companyId,
      amount: r.amount,
      paymentMethod: 'paypay' as const,
      paidAt: new Date(r.paidAt),
      paypayTransactionId: r.transactionId,
    }))

    await db.insert(schema.sales).values(insertData)

    return c.json({ data: { imported: newRows.length, skipped, duplicates } })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Inventory ----------

// GET /api/admin/inventory/items
admin.get('/inventory/items', async (c) => {
  const staff = c.get('staff')

  try {
    const result = await db.execute(
      sql`SELECT * FROM inventory_items WHERE company_id = ${staff.companyId} AND is_active = true ORDER BY category, name`
    )
    const data = (result as unknown as { rows: unknown[] }).rows ?? result
    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// GET /api/admin/inventory/stock
admin.get('/inventory/stock', async (c) => {
  const staff = c.get('staff')
  const storeId = c.req.query('storeId')

  try {
    const storeCondition = storeId ? sql` AND s.store_id = ${storeId}` : sql``
    const result = await db.execute(sql`
      SELECT s.*,
        json_build_object('name', i.name, 'category', i.category, 'unit', i.unit, 'cost_price', i.cost_price, 'selling_price', i.selling_price) as item,
        json_build_object('name', st.name) as store
      FROM inventory_stock s
      LEFT JOIN inventory_items i ON s.item_id = i.id
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.company_id = ${staff.companyId}${storeCondition}
    `)
    const data = (result as unknown as { rows: unknown[] }).rows ?? result
    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// PATCH /api/admin/inventory/stock/:id
admin.patch('/inventory/stock/:id', async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')
  const body = await c.req.json<{ quantity?: number; minQuantity?: number }>()

  try {
    const setClauses = []
    if (body.quantity !== undefined) setClauses.push(sql`quantity = ${body.quantity}`)
    if (body.minQuantity !== undefined) setClauses.push(sql`min_quantity = ${body.minQuantity}`)

    if (setClauses.length === 0) {
      return c.json({ message: 'No fields to update' }, 400)
    }

    const setFragment = sql.join(setClauses, sql`, `)
    const result = await db.execute(
      sql`UPDATE inventory_stock SET ${setFragment} WHERE id = ${id} AND company_id = ${staff.companyId} RETURNING *`
    )
    const rows = (result as unknown as { rows: unknown[] }).rows ?? result
    const data = Array.isArray(rows) ? rows[0] : rows
    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// ---------- Attendances ----------

// GET /api/admin/attendances/my-status
admin.get('/attendances/my-status', async (c) => {
  const staff = c.get('staff')

  try {
    const results = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.staffId, staff.id),
          eq(schema.attendances.status, 'clocked_in')
        )
      )
      .limit(1)

    return c.json({ data: results[0] ?? null })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// POST /api/admin/attendances/clock-in
admin.post('/attendances/clock-in', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ note?: string }>().catch(() => ({ note: undefined }))

  try {
    // Check if already clocked in
    const existing = await db
      .select({ id: schema.attendances.id })
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.staffId, staff.id),
          eq(schema.attendances.status, 'clocked_in')
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return c.json({ message: 'すでに出勤中です' }, 400)
    }

    const [data] = await db
      .insert(schema.attendances)
      .values({
        staffId: staff.id,
        storeId: staff.storeId,
        companyId: staff.companyId,
        clockIn: new Date(),
        clockInNote: body.note ?? null,
        status: 'clocked_in',
      })
      .returning()

    return c.json({ data }, 201)
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

// POST /api/admin/attendances/clock-out
admin.post('/attendances/clock-out', async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ note?: string }>().catch(() => ({ note: undefined }))

  try {
    const existing = await db
      .select({ id: schema.attendances.id })
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.staffId, staff.id),
          eq(schema.attendances.status, 'clocked_in')
        )
      )
      .limit(1)

    if (existing.length === 0) {
      return c.json({ message: '出勤記録がありません' }, 400)
    }

    const [data] = await db
      .update(schema.attendances)
      .set({
        clockOut: new Date(),
        clockOutNote: body.note ?? null,
        status: 'completed',
      })
      .where(eq(schema.attendances.id, existing[0].id))
      .returning()

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
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
  const staffIdFilter = c.req.query('staffId')

  try {
    const conditions = [eq(schema.attendances.companyId, staff.companyId)]
    if (storeId) conditions.push(eq(schema.attendances.storeId, storeId))
    if (staffIdFilter) conditions.push(eq(schema.attendances.staffId, staffIdFilter))
    if (startDate) conditions.push(gte(schema.attendances.clockIn, new Date(`${startDate}T00:00:00`)))
    if (endDate) conditions.push(lte(schema.attendances.clockIn, new Date(`${endDate}T23:59:59`)))

    const attendancesRaw = await db
      .select()
      .from(schema.attendances)
      .where(and(...conditions))
      .orderBy(desc(schema.attendances.clockIn))

    // Enrich with staff names and corrector names
    const staffIds = [...new Set([
      ...attendancesRaw.map(a => a.staffId),
      ...attendancesRaw.map(a => a.correctedBy).filter(Boolean),
    ])] as string[]

    const staffData = staffIds.length > 0
      ? await db.select({ id: schema.staff.id, displayName: schema.staff.displayName }).from(schema.staff).where(inArray(schema.staff.id, staffIds))
      : []

    const staffMap = new Map(staffData.map(s => [s.id, { display_name: s.displayName }]))

    const data = attendancesRaw.map(a => ({
      ...a,
      staff: staffMap.get(a.staffId) ?? null,
      corrector: a.correctedBy ? staffMap.get(a.correctedBy) ?? null : null,
    }))

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
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

  try {
    const updateData: Record<string, unknown> = {
      status: 'corrected',
      correctedBy: staff.id,
      correctionReason: body.correctionReason,
    }
    if (body.clockIn !== undefined) updateData.clockIn = new Date(body.clockIn)
    if (body.clockOut !== undefined) updateData.clockOut = new Date(body.clockOut)
    if (body.clockInNote !== undefined) updateData.clockInNote = body.clockInNote
    if (body.clockOutNote !== undefined) updateData.clockOutNote = body.clockOutNote

    const [data] = await db
      .update(schema.attendances)
      .set(updateData)
      .where(and(eq(schema.attendances.id, id), eq(schema.attendances.companyId, staff.companyId)))
      .returning()

    return c.json({ data })
  } catch (e) {
    return c.json({ message: (e as Error).message }, 500)
  }
})

export { admin }
