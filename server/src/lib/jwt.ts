import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET || 'dev-secret'

function base64url(data: string | Buffer): string {
  return Buffer.from(data).toString('base64url')
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}

export function sign(payload: Record<string, unknown>, maxAge: number): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAge,
  }))
  const signature = hmac(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

export function verify<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null

    const expected = hmac(`${header}.${body}`)
    if (signature !== expected) return null

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload as T
  } catch {
    return null
  }
}
