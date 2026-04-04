import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { formatPrice, formatDateTimeJP } from '@/lib/utils'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { Customer, ReservationWithDetails } from '@/types/models'

interface CustomerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

function useCustomerReservations(customerId: string | undefined) {
  return useQuery<ReservationWithDetails[]>({
    queryKey: ['customer-reservations', customerId],
    queryFn: () => api<ReservationWithDetails[]>(`/api/admin/customers/${customerId}/reservations`),
    enabled: !!customerId,
  })
}

export function CustomerDetailModal({ isOpen, onClose, customer }: CustomerDetailModalProps) {
  const { data: reservations, isLoading } = useCustomerReservations(
    isOpen ? customer?.id : undefined,
  )

  if (!customer) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="顧客詳細" size="lg">
      <div className="space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="text-gray-500">氏名</span>
            <p className="font-medium text-gray-900">{customer.name}</p>
          </div>
          <div>
            <span className="text-gray-500">フリガナ</span>
            <p className="font-medium text-gray-900">{customer.name_kana ?? '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">電話番号</span>
            <p className="font-medium text-gray-900">{customer.phone ?? '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">メールアドレス</span>
            <p className="font-medium text-gray-900">{customer.email ?? '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">来店回数</span>
            <p className="font-medium text-gray-900">{customer.visit_count ?? 0}回</p>
          </div>
          <div>
            <span className="text-gray-500">最終来店日</span>
            <p className="font-medium text-gray-900">
              {customer.last_visit_at ? formatDateTimeJP(customer.last_visit_at) : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">流入元</span>
            <p className="font-medium text-gray-900">{customer.source ?? '-'}</p>
          </div>
          {customer.notes && (
            <div className="col-span-2">
              <span className="text-gray-500">メモ</span>
              <p className="font-medium text-gray-900 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Reservation History */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">予約履歴</h3>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-6 w-6 text-primary-600" />
            </div>
          ) : reservations && reservations.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {reservations.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {r.menu?.name ?? '不明なメニュー'}
                    </p>
                    <p className="text-gray-500">
                      {formatDateTimeJP(r.start_at)} / {r.staff?.display_name ?? '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700">
                      {r.menu?.price != null ? formatPrice(r.menu.price) : '-'}
                    </span>
                    <Badge className={STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">予約履歴がありません</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
