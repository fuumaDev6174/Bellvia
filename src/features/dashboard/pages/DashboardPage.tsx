import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useStoreContext } from '@/hooks/useStoreContext'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import { Card, CardHeader, CardContent, Spinner } from '@/components/ui'
import { formatDateJP, formatTimeJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ClockButton } from '@/features/admin-attendance/components/ClockButton'
import type { ReservationWithDetails, Staff } from '@/types/models'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

interface DashboardStats {
  todayReservations: ReservationWithDetails[]
  weekCount: number
  customerCount: number
}

// Time slots from 9:00 to 21:00 (30min intervals)
const START_HOUR = 9
const END_HOUR = 21
const TIME_LABELS: string[] = []
for (let h = START_HOUR; h <= END_HOUR; h++) {
  TIME_LABELS.push(`${h}:00`)
}

function timeToMinutes(isoString: string): number {
  const d = new Date(isoString)
  const hours = d.getHours()
  const minutes = d.getMinutes()
  return hours * 60 + minutes
}

function minutesToPercent(minutes: number): number {
  const totalRange = (END_HOUR - START_HOUR) * 60
  const offset = minutes - START_HOUR * 60
  return Math.max(0, Math.min(100, (offset / totalRange) * 100))
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-400',
  no_show: 'bg-red-400',
}

export default function DashboardPage() {
  const { activeStoreId } = useStoreContext()
  const { staff: currentStaff, role } = useCurrentStaff()
  const today = getToday()
  const isStylist = role === 'stylist'

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', activeStoreId, today],
    queryFn: () => api<DashboardStats>('/api/admin/dashboard/stats'),
    enabled: !!activeStoreId,
  })

  const { data: staffList } = useQuery<Staff[]>({
    queryKey: ['admin-staff-schedule', activeStoreId],
    queryFn: () => api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}&roles=stylist,store_manager`),
    enabled: !!activeStoreId,
  })

  const allReservations = data?.todayReservations ?? []
  const todayReservations = isStylist
    ? allReservations.filter((r) => r.staff_id === currentStaff?.id)
    : allReservations

  const weekCount = data?.weekCount ?? 0
  const customerCount = data?.customerCount ?? 0
  const confirmedToday = todayReservations.filter((r) => r.status === 'confirmed').length

  // Sort staff: for stylist, put self first
  const sortedStaff = useMemo(() => {
    if (!staffList) return []
    const list = [...staffList]
    if (isStylist && currentStaff) {
      list.sort((a, b) => {
        if (a.id === currentStaff.id) return -1
        if (b.id === currentStaff.id) return 1
        return a.sort_order - b.sort_order
      })
    }
    return list
  }, [staffList, isStylist, currentStaff])

  // Group reservations by staff_id
  const reservationsByStaff = useMemo(() => {
    const map = new Map<string, ReservationWithDetails[]>()
    for (const r of allReservations) {
      if (!map.has(r.staff_id)) map.set(r.staff_id, [])
      map.get(r.staff_id)!.push(r)
    }
    return map
  }, [allReservations])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStylist ? 'マイダッシュボード' : 'ダッシュボード'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{formatDateJP(today)}</p>
        </div>
        <ClockButton />
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 gap-4 ${isStylist ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-500">
              {isStylist ? '本日の自分の予約' : '本日の予約'}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{todayReservations.length}</p>
            <p className="mt-1 text-xs text-gray-500">確定: {confirmedToday}件</p>
          </CardContent>
        </Card>
        {!isStylist && (
          <>
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500">今週の予約</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{weekCount}</p>
                <p className="mt-1 text-xs text-gray-500">今日から日曜日まで</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500">顧客数</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{customerCount}</p>
                <p className="mt-1 text-xs text-gray-500">全顧客</p>
              </CardContent>
            </Card>
          </>
        )}
        {isStylist && (
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500">次の予約</p>
              {todayReservations.filter(r => r.status === 'confirmed').length > 0 ? (
                (() => {
                  const next = todayReservations
                    .filter(r => r.status === 'confirmed')
                    .sort((a, b) => a.start_at.localeCompare(b.start_at))[0]
                  return (
                    <div className="mt-1">
                      <p className="text-2xl font-bold text-gray-900">{formatTimeJP(next.start_at)}</p>
                      <p className="text-xs text-gray-500">
                        {next.customer?.name ?? next.guest_name ?? '-'} / {next.menu?.name ?? '-'}
                      </p>
                    </div>
                  )
                })()
              ) : (
                <p className="mt-1 text-lg text-gray-400">なし</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">本日のスケジュール</h2>
        </CardHeader>
        <div className="overflow-x-auto p-4">
          <div className="min-w-[800px]">
            {/* Time header */}
            <div className="flex">
              <div className="w-28 shrink-0" />
              <div className="relative flex-1">
                <div className="flex">
                  {TIME_LABELS.map((label, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 font-medium"
                      style={{ width: `${100 / (TIME_LABELS.length - 1)}%`, marginLeft: i === 0 ? 0 : undefined }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Staff rows */}
            {sortedStaff.map((s) => {
              const staffReservations = reservationsByStaff.get(s.id) ?? []
              const isCurrentUser = s.id === currentStaff?.id

              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-stretch border-t',
                    isCurrentUser && isStylist && 'bg-primary-50',
                  )}
                >
                  {/* Staff name */}
                  <div className="w-28 shrink-0 flex items-center px-2 py-3">
                    <div>
                      <p className={cn('text-sm font-medium truncate', isCurrentUser ? 'text-primary-700' : 'text-gray-900')}>
                        {s.display_name}
                      </p>
                      {isCurrentUser && isStylist && (
                        <p className="text-xs text-primary-500">あなた</p>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative flex-1 min-h-[56px] py-1">
                    {/* Grid lines */}
                    {TIME_LABELS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-gray-100"
                        style={{ left: `${(i / (TIME_LABELS.length - 1)) * 100}%` }}
                      />
                    ))}

                    {/* Current time indicator */}
                    {(() => {
                      const now = new Date()
                      const nowMin = now.getHours() * 60 + now.getMinutes()
                      if (nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60) {
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                            style={{ left: `${minutesToPercent(nowMin)}%` }}
                          />
                        )
                      }
                      return null
                    })()}

                    {/* Reservation blocks */}
                    {staffReservations.map((r) => {
                      const startMin = timeToMinutes(r.start_at)
                      const endMin = timeToMinutes(r.end_at)
                      const left = minutesToPercent(startMin)
                      const width = minutesToPercent(endMin) - left
                      const customerName = r.customer?.name ?? r.guest_name ?? '-'

                      return (
                        <div
                          key={r.id}
                          className={cn(
                            'absolute top-1 bottom-1 rounded px-1.5 py-0.5 overflow-hidden cursor-default',
                            STATUS_COLORS[r.status] ?? 'bg-gray-300',
                            r.status === 'cancelled' || r.status === 'no_show' ? 'opacity-50' : '',
                          )}
                          style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                          title={`${formatTimeJP(r.start_at)}〜${formatTimeJP(r.end_at)} ${customerName} / ${r.menu?.name ?? ''}`}
                        >
                          <p className="text-[10px] font-medium text-white truncate leading-tight">
                            {customerName}
                          </p>
                          <p className="text-[9px] text-white/80 truncate leading-tight">
                            {r.menu?.name ?? ''}
                          </p>
                        </div>
                      )
                    })}

                    {/* Empty state */}
                    {staffReservations.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-300">予約なし</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {sortedStaff.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">スタッフが登録されていません</div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-blue-500" /> 予約確定
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-green-500" /> 施術完了
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-gray-400" /> キャンセル
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-400" /> 無断キャンセル
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-red-400" /> 現在時刻
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
