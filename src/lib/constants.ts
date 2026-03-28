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

export const DAY_LABELS: Record<string, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
}
