import { Hono } from 'hono'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  stores,
  storeBusinessHours,
  menus,
  menuCategories,
  staff,
  staffSpecialties,
} from '../db/schema.js'

const pub = new Hono()

// GET /api/public/stores
pub.get('/stores', async (c) => {
  const storeRows = await db
    .select()
    .from(stores)
    .where(eq(stores.isActive, true))
    .orderBy(stores.name)

  // Attach business hours
  const storeIds = storeRows.map(s => s.id)
  const hours = storeIds.length > 0
    ? await db.select().from(storeBusinessHours).where(inArray(storeBusinessHours.storeId, storeIds))
    : []

  const data = storeRows.map(s => ({
    ...s,
    business_hours: hours.filter(h => h.storeId === s.id),
  }))

  return c.json({ data })
})

// GET /api/public/stores/:slug
pub.get('/stores/:slug', async (c) => {
  const slug = c.req.param('slug')

  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.slug, slug), eq(stores.isActive, true)))
    .limit(1)

  if (!store) {
    return c.json({ message: 'Store not found' }, 404)
  }

  const hours = await db
    .select()
    .from(storeBusinessHours)
    .where(eq(storeBusinessHours.storeId, store.id))

  return c.json({ data: { ...store, business_hours: hours } })
})

// GET /api/public/stores/:storeId/menus
pub.get('/stores/:storeId/menus', async (c) => {
  const storeId = c.req.param('storeId')

  const rows = await db
    .select({
      id: menus.id,
      storeId: menus.storeId,
      companyId: menus.companyId,
      name: menus.name,
      categoryId: menus.categoryId,
      description: menus.description,
      price: menus.price,
      durationMin: menus.durationMin,
      imageUrl: menus.imageUrl,
      isPublic: menus.isPublic,
      sortOrder: menus.sortOrder,
      workloadPoints: menus.workloadPoints,
      createdAt: menus.createdAt,
      updatedAt: menus.updatedAt,
      categoryName: menuCategories.name,
    })
    .from(menus)
    .leftJoin(menuCategories, eq(menus.categoryId, menuCategories.id))
    .where(and(eq(menus.storeId, storeId), eq(menus.isPublic, true)))
    .orderBy(menus.sortOrder)

  const data = rows.map(r => ({
    id: r.id,
    store_id: r.storeId,
    company_id: r.companyId,
    name: r.name,
    category_id: r.categoryId,
    category: r.categoryId ? { id: r.categoryId, name: r.categoryName } : null,
    description: r.description,
    price: r.price,
    duration_min: r.durationMin,
    image_url: r.imageUrl,
    is_public: r.isPublic,
    sort_order: r.sortOrder,
    workload_points: r.workloadPoints,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }))

  return c.json({ data })
})

// GET /api/public/stores/:storeId/stylists
pub.get('/stores/:storeId/stylists', async (c) => {
  const storeId = c.req.param('storeId')

  const staffRows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.storeId, storeId), eq(staff.isActive, true)))
    .orderBy(staff.sortOrder)

  // Attach specialties
  const staffIds = staffRows.map(s => s.id)
  const specs = staffIds.length > 0
    ? await db.select().from(staffSpecialties).where(inArray(staffSpecialties.staffId, staffIds))
    : []

  const data = staffRows.map(s => ({
    ...s,
    specialties: specs.filter(sp => sp.staffId === s.id).map(sp => sp.specialty),
  }))

  return c.json({ data })
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

  const result = await db.execute(sql`
    SELECT get_available_slots(
      ${storeId}::uuid,
      ${date}::date,
      ${menuId}::uuid,
      ${staffId ? staffId : null}::uuid
    ) as data
  `)

  const rows = (result as unknown as { rows: Array<Record<string, unknown>> }).rows ?? result
  const data = (rows as Array<Record<string, unknown>>)[0]?.data ?? []
  return c.json({ data })
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

  try {
    const result = await db.execute(sql`
      SELECT create_guest_reservation(
        ${body.storeId}::uuid,
        ${body.staffId}::uuid,
        ${body.menuId}::uuid,
        ${body.startAt}::timestamptz,
        ${body.guestName}::text,
        ${body.guestPhone}::text,
        ${body.guestEmail ?? null}::text,
        ${body.notes ?? null}::text
      ) as data
    `)

    const rows = (result as unknown as { rows: Array<Record<string, unknown>> }).rows ?? result
    const data = (rows as Array<Record<string, unknown>>)[0]?.data
    return c.json({ data }, 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Reservation failed'
    return c.json({ message }, 500)
  }
})

export { pub }
