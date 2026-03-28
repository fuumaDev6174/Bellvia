import { useLocation, Link, Navigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { SEOHead } from '@/components/layout/SEOHead'
import { Button } from '@/components/ui'
import { formatDateTimeJP } from '@/lib/utils'
import type { GuestReservationResult } from '@/types/models'

export default function ReservationConfirmPage() {
  const location = useLocation()
  const reservation = (location.state as { reservation?: GuestReservationResult })?.reservation

  if (!reservation) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <SEOHead title="予約完了" />

      <section className="py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">予約が完了しました</h1>
          <p className="mt-2 text-gray-600">ご来店をお待ちしております</p>

          <div className="mt-8 rounded-xl border bg-gray-50 text-left divide-y">
            <Row label="店舗" value={reservation.store_name} />
            <Row label="メニュー" value={reservation.menu_name} />
            <Row label="スタイリスト" value={reservation.staff_name} />
            <Row label="日時" value={formatDateTimeJP(reservation.start_at)} />
            <Row label="お名前" value={reservation.guest_name} />
          </div>

          <p className="mt-6 text-sm text-gray-500">
            予約の変更・キャンセルはお電話にてご連絡ください
          </p>

          <Link to="/" className="mt-6 inline-block">
            <Button variant="outline">トップページに戻る</Button>
          </Link>
        </div>
      </section>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-3">
      <dt className="w-28 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
