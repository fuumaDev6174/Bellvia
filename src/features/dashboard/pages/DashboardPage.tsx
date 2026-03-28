import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useStoreContext } from '@/hooks/useStoreContext'
import { Card, CardHeader, CardContent, Spinner } from '@/components/ui'
import { formatDateJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'
import { ReservationTable } from '@/features/admin-reservation/components/ReservationTable'
import type { ReservationWithDetails } from '@/types/models'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

function getWeekEnd(): string {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + (7 - today.getDay()))
  return end.toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

export default function DashboardPage() {
  const { activeStoreId } = useStoreContext()
  const today = getToday()
  const weekEnd = getWeekEnd()

  // Today's reservations
  const { data: todayReservations = [], isLoading: loadingToday } = useQuery<
    ReservationWithDetails[]
  >({
    queryKey: ['reservations', 'today', activeStoreId, today],
    queryFn: async () => {
      if (!activeStoreId) return []
      const { data, error } = await supabase
        .from('reservations')
        .select(
          `
          *,
          staff:staff_id (display_name, photo_url),
          menu:menu_id (name, price, duration_min, category),
          customer:customer_id (name, phone, email)
        `,
        )
        .eq('store_id', activeStoreId)
        .gte('start_at', `${today}T00:00:00`)
        .lte('start_at', `${today}T23:59:59`)
        .order('start_at', { ascending: true })
      if (error) throw error
      return (data as unknown as ReservationWithDetails[]) ?? []
    },
    enabled: !!activeStoreId,
  })

  // This week's reservation count
  const { data: weekCount = 0 } = useQuery<number>({
    queryKey: ['reservations', 'week-count', activeStoreId, today, weekEnd],
    queryFn: async () => {
      if (!activeStoreId) return 0
      const { count, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', activeStoreId)
        .gte('start_at', `${today}T00:00:00`)
        .lte('start_at', `${weekEnd}T23:59:59`)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!activeStoreId,
  })

  // Total customer count
  const { data: customerCount = 0 } = useQuery<number>({
    queryKey: ['customers', 'count', activeStoreId],
    queryFn: async () => {
      if (!activeStoreId) return 0
      // customers are scoped by company_id; get company_id from any store reservation
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count ?? 0
    },
    enabled: !!activeStoreId,
  })

  if (loadingToday) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const confirmedToday = todayReservations.filter((r) => r.status === 'confirmed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">{formatDateJP(today)}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-500">本日の予約</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{todayReservations.length}</p>
            <p className="mt-1 text-xs text-gray-500">確定: {confirmedToday}件</p>
          </CardContent>
        </Card>
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
      </div>

      {/* Today's Reservations */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">本日の予約一覧</h2>
        </CardHeader>
        <ReservationTable reservations={todayReservations} compact />
      </Card>
    </div>
  )
}
