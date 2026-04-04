import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useStoreContext } from '@/hooks/useStoreContext'
import { TIMEZONE } from '@/lib/constants'
import { cn, formatTimeJP } from '@/lib/utils'
import { Card, Button, Spinner } from '@/components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { useReservations } from '../hooks/useReservations'
import type { ReservationWithDetails, Staff } from '@/types/models'

/** Returns Monday of the given week (ISO week) as YYYY-MM-DD */
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatLocalDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

export default function ReservationCalendarPage() {
  const { activeStoreId } = useStoreContext()
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekEnd = addDays(weekStart, 6)
  const startDate = formatLocalDate(weekStart)
  const endDate = formatLocalDate(weekEnd)

  // Fetch stylists
  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['staff', activeStoreId],
    queryFn: () =>
      api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}&roles=stylist,store_manager`),
    enabled: !!activeStoreId,
  })

  const { data: reservations = [], isLoading } = useReservations({
    storeId: activeStoreId,
    startDate,
    endDate,
  })

  // Group reservations by staff_id -> date
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, ReservationWithDetails[]>>()
    for (const r of reservations) {
      const dateKey = r.start_at.slice(0, 10)
      if (!map.has(r.staff_id)) map.set(r.staff_id, new Map())
      const staffMap = map.get(r.staff_id)!
      if (!staffMap.has(dateKey)) staffMap.set(dateKey, [])
      staffMap.get(dateKey)!.push(r)
    }
    return map
  }, [reservations])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const navigateWeek = (offset: number) => {
    setWeekStart((prev) => addDays(prev, offset * 7))
  }

  const goToThisWeek = () => {
    setWeekStart(getMonday(new Date()))
  }

  const weekLabel = `${weekStart.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  })} - ${weekEnd.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">予約カレンダー</h1>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          to="/admin/reservations"
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          リスト
        </Link>
        <Link
          to="/admin/reservations/calendar"
          className="border-b-2 border-primary-600 px-4 py-2 text-sm font-medium text-primary-600"
        >
          カレンダー
        </Link>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
          &larr; 前週
        </Button>
        <Button variant="ghost" size="sm" onClick={goToThisWeek}>
          今週
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
          翌週 &rarr;
        </Button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : staffList.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          スタイリストが登録されていません
        </p>
      ) : (
        <div className="space-y-8">
          {staffList.map((staff) => {
            const staffReservations = grouped.get(staff.id)

            return (
              <Card key={staff.id}>
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {staff.display_name}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <div className="grid min-w-[700px] grid-cols-7">
                    {/* Day headers */}
                    {weekDays.map((day, i) => {
                      const isToday =
                        formatLocalDate(day) ===
                        new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
                      return (
                        <div
                          key={i}
                          className={cn(
                            'border-b border-r px-2 py-2 text-center text-xs font-medium',
                            isToday ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-500',
                          )}
                        >
                          <div>{DAY_LABELS[i]}</div>
                          <div className="text-sm">
                            {day.toLocaleDateString('ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                              timeZone: TIMEZONE,
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {/* Reservation blocks */}
                    {weekDays.map((day, i) => {
                      const dateKey = formatLocalDate(day)
                      const dayReservations = staffReservations?.get(dateKey) ?? []

                      return (
                        <div
                          key={i}
                          className="min-h-[120px] border-r p-1 last:border-r-0"
                        >
                          {dayReservations.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-xs text-gray-300">
                              -
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {dayReservations.map((r) => (
                                <div
                                  key={r.id}
                                  className={cn(
                                    'rounded p-1.5 text-xs',
                                    r.status === 'confirmed'
                                      ? 'bg-blue-50 border border-blue-200'
                                      : r.status === 'completed'
                                        ? 'bg-green-50 border border-green-200'
                                        : r.status === 'cancelled'
                                          ? 'bg-gray-50 border border-gray-200 opacity-60'
                                          : 'bg-red-50 border border-red-200 opacity-60',
                                  )}
                                >
                                  <div className="font-medium">
                                    {formatTimeJP(r.start_at)}
                                  </div>
                                  <div className="truncate text-gray-700">
                                    {r.customer?.name ?? r.guest_name ?? '-'}
                                  </div>
                                  <div className="truncate text-gray-500">
                                    {r.menu?.name ?? ''}
                                  </div>
                                  <StatusBadge status={r.status} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
