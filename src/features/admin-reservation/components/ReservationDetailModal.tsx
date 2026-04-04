import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Modal, Button, Select } from '@/components/ui'
import { STATUS_LABELS } from '@/lib/constants'
import { formatDateJP, formatTimeJP, formatPrice, formatDuration } from '@/lib/utils'
import type { ReservationWithDetails, ReservationStatus } from '@/types/models'
import { StatusBadge } from './StatusBadge'

interface ReservationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: ReservationWithDetails | null
}

const TRANSITION_OPTIONS: Record<string, ReservationStatus[]> = {
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export function ReservationDetailModal({
  isOpen,
  onClose,
  reservation,
}: ReservationDetailModalProps) {
  const [nextStatus, setNextStatus] = useState<string>('')

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      await api(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },
    onSuccess: () => {
      toast.success('ステータスを更新しました')
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      setNextStatus('')
      onClose()
    },
    onError: () => {
      toast.error('ステータスの更新に失敗しました')
    },
  })

  if (!reservation) return null

  const customerName = reservation.customer?.name ?? reservation.guest_name ?? '未設定'
  const customerPhone = reservation.customer?.phone ?? reservation.guest_phone ?? '-'
  const customerEmail = reservation.customer?.email ?? reservation.guest_email ?? '-'
  const allowedTransitions = TRANSITION_OPTIONS[reservation.status] ?? []

  const handleStatusChange = () => {
    if (!nextStatus) return
    updateStatusMutation.mutate({
      id: reservation.id,
      status: nextStatus as ReservationStatus,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="予約詳細" size="lg">
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">ステータス:</span>
          <StatusBadge status={reservation.status} />
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">日付</p>
            <p className="text-sm text-gray-900">{formatDateJP(reservation.start_at)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">時間</p>
            <p className="text-sm text-gray-900">
              {formatTimeJP(reservation.start_at)} - {formatTimeJP(reservation.end_at)}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">お客様情報</p>
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-xs text-gray-500">名前</p>
              <p className="text-sm text-gray-900">{customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">電話番号</p>
              <p className="text-sm text-gray-900">{customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">メール</p>
              <p className="text-sm text-gray-900">{customerEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">予約経路</p>
              <p className="text-sm text-gray-900">{reservation.source ?? '-'}</p>
            </div>
          </div>
        </div>

        {/* Menu & Staff */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">メニュー</p>
            <p className="text-sm text-gray-900">{reservation.menu?.name ?? '-'}</p>
            {reservation.menu && (
              <p className="text-xs text-gray-500">
                {formatPrice(reservation.menu.price)} / {formatDuration(reservation.menu.duration_min)}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">スタイリスト</p>
            <p className="text-sm text-gray-900">{reservation.staff?.display_name ?? '-'}</p>
          </div>
        </div>

        {/* Notes */}
        {reservation.notes && (
          <div>
            <p className="text-sm font-medium text-gray-500">備考</p>
            <p className="whitespace-pre-wrap text-sm text-gray-900">{reservation.notes}</p>
          </div>
        )}

        {/* Status Change */}
        {allowedTransitions.length > 0 && (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">ステータス変更</p>
            <div className="flex items-end gap-3">
              <Select
                label=""
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                placeholder="変更先を選択"
                options={allowedTransitions.map((s) => ({
                  value: s,
                  label: STATUS_LABELS[s] ?? s,
                }))}
              />
              <Button
                onClick={handleStatusChange}
                disabled={!nextStatus}
                loading={updateStatusMutation.isPending}
                variant={nextStatus === 'cancelled' || nextStatus === 'no_show' ? 'danger' : 'primary'}
                size="sm"
              >
                変更
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
