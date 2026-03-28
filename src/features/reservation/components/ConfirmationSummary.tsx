import { Button } from '@/components/ui'
import { formatPrice, formatDuration, formatDateJP, formatTimeJP } from '@/lib/utils'
import type { Menu, Staff, Store } from '@/types/models'
import type { GuestInfo } from './GuestInfoForm'

interface ConfirmationSummaryProps {
  store: Store
  menu: Menu
  stylist: Staff | null
  selectedTime: string
  guestInfo: GuestInfo
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function ConfirmationSummary({
  store,
  menu,
  stylist,
  selectedTime,
  guestInfo,
  onConfirm,
  onBack,
  isSubmitting,
}: ConfirmationSummaryProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">予約内容の確認</h3>
      <div className="rounded-xl border bg-gray-50 divide-y">
        <Row label="店舗" value={store.name} />
        <Row label="メニュー" value={`${menu.name} (${formatPrice(menu.price)} / ${formatDuration(menu.duration_min)})`} />
        <Row label="スタイリスト" value={stylist?.display_name ?? '指名なし'} />
        <Row label="日時" value={`${formatDateJP(selectedTime)} ${formatTimeJP(selectedTime)}`} />
        <Row label="お名前" value={guestInfo.name} />
        <Row label="電話番号" value={guestInfo.phone} />
        {guestInfo.email && <Row label="メール" value={guestInfo.email} />}
        {guestInfo.notes && <Row label="備考" value={guestInfo.notes} />}
      </div>
      <div className="mt-6 flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          戻る
        </Button>
        <Button onClick={onConfirm} loading={isSubmitting} className="flex-1">
          予約を確定する
        </Button>
      </div>
    </div>
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
