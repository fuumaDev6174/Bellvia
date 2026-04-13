export const APP_NAME = 'Bellevia'

export const TIMEZONE = 'Asia/Tokyo'

export const SLOT_INTERVAL_MINUTES = 30

export const BOOKING_ADVANCE_DAYS = 30

export const STATUS_LABELS: Record<string, string> = {
  confirmed: '予約確定',
  completed: '施術完了',
  cancelled: 'キャンセル',
  no_show: '無断キャンセル',
}

export const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
}

export const ROLE_LABELS: Record<string, string> = {
  company_admin: '会社管理者',
  store_manager: '店長',
  stylist: 'スタイリスト',
}

// day_of_week: 0=Mon, 1=Tue, ..., 6=Sun
export const DAY_LABELS: Record<number, string> = {
  0: '月',
  1: '火',
  2: '水',
  3: '木',
  4: '金',
  5: '土',
  6: '日',
}
