import bcrypt from 'bcryptjs'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, staff } from '../db/schema.js'
import { sign, verify } from './jwt.js'

export interface StaffContext {
  id: string
  userId: string
  storeId: string
  companyId: string
  role: string
  displayName: string
}

export interface SessionPayload {
  userId: string
  email: string
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function authenticateUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user || !user.passwordHash) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return user
}

export async function lookupStaff(userId: string): Promise<StaffContext | null> {
  const [s] = await db
    .select({
      id: staff.id,
      userId: staff.userId,
      storeId: staff.storeId,
      companyId: staff.companyId,
      role: staff.role,
      displayName: staff.displayName,
    })
    .from(staff)
    .where(and(eq(staff.userId, userId), eq(staff.isActive, true)))
    .limit(1)

  if (!s || !s.userId) return null

  return {
    id: s.id,
    userId: s.userId,
    storeId: s.storeId,
    companyId: s.companyId,
    role: s.role,
    displayName: s.displayName,
  }
}

export function createSessionToken(payload: SessionPayload): string {
  return sign(payload as unknown as Record<string, unknown>, SESSION_MAX_AGE)
}

export function verifySessionToken(token: string): SessionPayload | null {
  return verify<SessionPayload>(token)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export { SESSION_MAX_AGE }
