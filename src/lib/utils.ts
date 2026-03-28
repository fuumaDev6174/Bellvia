import { TIMEZONE } from './constants'

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}

export function formatDateJP(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTimeJP(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ja-JP', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeJP(dateStr: string): string {
  return `${formatDateJP(dateStr)} ${formatTimeJP(dateStr)}`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
