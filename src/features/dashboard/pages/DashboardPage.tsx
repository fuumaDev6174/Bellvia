import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useStoreContext } from '@/hooks/useStoreContext'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import { Card, CardHeader, CardContent, Spinner } from '@/components/ui'
import { formatDateJP, formatTimeJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'
import { ReservationTable } from '@/features/admin-reservation/components/ReservationTable'
import type { ReservationWithDetails } from '@/types/models'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

interface DashboardStats {
  todayReservations: ReservationWithDetails[]
  weekCount: number
  customerCount: number
}

export default function DashboardPage() {
  const { activeStoreId } = useStoreContext()
  const { staff, role } = useCurrentStaff()
  const today = getToday()
  const isStylist = role === 'stylist'

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', activeStoreId, today],
    queryFn: () => api<DashboardStats>('/api/admin/dashboard/stats'),
    enabled: !!activeStoreId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const allReservations = data?.todayReservations ?? []

  // Stylist sees only their own reservations
  const todayReservations = isStylist
    ? allReservations.filter((r) => r.staff_id === staff?.id)
    : allReservations

  const weekCount = data?.weekCount ?? 0
  const customerCount = data?.customerCount ?? 0
  const confirmedToday = todayReservations.filter((r) => r.status === 'confirmed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isStylist ? 'マイダッシュボード' : 'ダッシュボード'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{formatDateJP(today)}</p>
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

      {/* Today's Reservations */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            {isStylist ? '本日のスケジュール' : '本日の予約一覧'}
          </h2>
        </CardHeader>
        <ReservationTable reservations={todayReservations} compact />
      </Card>
    </div>
  )
}
