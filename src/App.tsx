import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { Spinner } from '@/components/ui'

// Public pages
const HomePage = lazy(() => import('@/features/landing/pages/HomePage'))
const StorePage = lazy(() => import('@/features/landing/pages/StorePage'))
const MenuPage = lazy(() => import('@/features/landing/pages/MenuPage'))
const StylistPage = lazy(() => import('@/features/landing/pages/StylistPage'))

// Reservation pages
const ReservationPage = lazy(() => import('@/features/reservation/pages/ReservationPage'))
const ReservationConfirmPage = lazy(() => import('@/features/reservation/pages/ReservationConfirmPage'))

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))

// Admin pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const ReservationListPage = lazy(() => import('@/features/admin-reservation/pages/ReservationListPage'))
const ReservationCalendarPage = lazy(() => import('@/features/admin-reservation/pages/ReservationCalendarPage'))
const MenuManagePage = lazy(() => import('@/features/admin-menu/pages/MenuManagePage'))
const StaffManagePage = lazy(() => import('@/features/admin-staff/pages/StaffManagePage'))
const CustomerListPage = lazy(() => import('@/features/admin-customer/pages/CustomerListPage'))
const StoreManagePage = lazy(() => import('@/features/admin-store/pages/StoreManagePage'))

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-8 w-8 text-primary-600" />
    </div>
  )
}

export default function App() {
  useAuthListener()

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/:storeSlug" element={<StorePage />} />
          <Route path="/:storeSlug/menu" element={<MenuPage />} />
          <Route path="/:storeSlug/stylists" element={<StylistPage />} />
          <Route path="/:storeSlug/reserve" element={<ReservationPage />} />
          <Route path="/:storeSlug/reserve/confirm" element={<ReservationConfirmPage />} />
        </Route>

        {/* Auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin routes */}
        <Route
          element={
            <AuthGuard>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/reservations" element={<ReservationListPage />} />
          <Route path="/admin/reservations/calendar" element={<ReservationCalendarPage />} />
          <Route path="/admin/menus" element={<MenuManagePage />} />
          <Route path="/admin/staff" element={<StaffManagePage />} />
          <Route path="/admin/customers" element={<CustomerListPage />} />
          <Route path="/admin/stores" element={<StoreManagePage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
