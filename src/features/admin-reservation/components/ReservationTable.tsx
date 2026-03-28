import type { ReservationWithDetails } from '@/types/models'
import { formatDateJP, formatTimeJP, formatPrice, formatDuration } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'

interface ReservationTableProps {
  reservations: ReservationWithDetails[]
  onRowClick?: (reservation: ReservationWithDetails) => void
  compact?: boolean
}

export function ReservationTable({ reservations, onRowClick, compact = false }: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        予約が見つかりません
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {!compact && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                日付
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              時間
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              お客様
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              メニュー
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              スタイリスト
            </th>
            {!compact && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                料金
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ステータス
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {reservations.map((reservation) => (
            <tr
              key={reservation.id}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
              onClick={() => onRowClick?.(reservation)}
            >
              {!compact && (
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {formatDateJP(reservation.start_at)}
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {formatTimeJP(reservation.start_at)}
                {' - '}
                {formatTimeJP(reservation.end_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {reservation.customer?.name ?? reservation.guest_name ?? '-'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                <div>{reservation.menu?.name ?? '-'}</div>
                {!compact && reservation.menu?.duration_min && (
                  <div className="text-xs text-gray-500">
                    {formatDuration(reservation.menu.duration_min)}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {reservation.staff?.display_name ?? '-'}
              </td>
              {!compact && (
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {reservation.menu?.price != null ? formatPrice(reservation.menu.price) : '-'}
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <StatusBadge status={reservation.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
