import type { Database } from './database.types'

// Row types (what you get from SELECT)
export type Company = Database['public']['Tables']['companies']['Row']
export type Store = Database['public']['Tables']['stores']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Menu = Database['public']['Tables']['menus']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type Sale = Database['public']['Tables']['sales']['Row']
export type Attendance = Database['public']['Tables']['attendances']['Row']

// Insert types (what you send for INSERT)
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type MenuInsert = Database['public']['Tables']['menus']['Insert']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert']
export type SaleInsert = Database['public']['Tables']['sales']['Insert']
export type AttendanceInsert = Database['public']['Tables']['attendances']['Insert']

// Update types (what you send for UPDATE)
export type MenuUpdate = Database['public']['Tables']['menus']['Update']
export type StaffUpdate = Database['public']['Tables']['staff']['Update']
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

// Enums
export const STAFF_ROLES = ['company_admin', 'store_manager', 'stylist'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export const RESERVATION_STATUSES = ['confirmed', 'completed', 'cancelled', 'no_show'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

export const RESERVATION_SOURCES = ['web', 'phone', 'line', 'walk-in'] as const
export type ReservationSource = (typeof RESERVATION_SOURCES)[number]

export const ATTENDANCE_STATUSES = ['clocked_in', 'completed', 'corrected'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const PAYMENT_METHODS = ['cash', 'card', 'paypay', 'other'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type MenuCategoryRecord = Database['public']['Tables']['menu_categories']['Row']

// Business hours type (normalized)
export type StoreBusinessHour = Database['public']['Tables']['store_business_hours']['Row']

// Legacy helpers for converting store_business_hours array to day-keyed map
export interface BusinessHourEntry {
  open: string
  close: string
}
export type BusinessHours = Record<string, BusinessHourEntry | null>

// RPC response types
export interface GuestReservationResult {
  reservation_id: string
  store_name: string
  staff_name: string
  menu_name: string
  start_at: string
  end_at: string
  guest_name: string
}

export interface AvailableSlot {
  time: string
  staff_id: string
  staff_name: string
}

// Reservation with joined data (for admin views)
export interface ReservationWithDetails extends Reservation {
  staff?: Pick<Staff, 'display_name' | 'photo_url'>
  menu?: Pick<Menu, 'name' | 'price' | 'duration_min'> & { category?: { name: string } | null }
  customer?: Pick<Customer, 'name' | 'phone' | 'email'> | null
}
