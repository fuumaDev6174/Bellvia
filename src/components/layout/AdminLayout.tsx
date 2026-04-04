import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Users,
  UserCircle,
  Store,
  JapaneseYen,
  Package,
  LogOut,
  Menu as MenuIcon,
  Scissors,
} from 'lucide-react'
import { useSignOut } from '@/hooks/useAuth'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { APP_NAME, ROLE_LABELS } from '@/lib/constants'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'ダッシュボード', exact: true },
  { to: '/admin/reservations', icon: CalendarDays, label: '予約管理' },
  { to: '/admin/menus', icon: UtensilsCrossed, label: 'メニュー管理' },
  { to: '/admin/staff', icon: Users, label: 'スタッフ管理' },
  { to: '/admin/customers', icon: UserCircle, label: '顧客一覧' },
  { to: '/admin/sales', icon: JapaneseYen, label: '売上管理' },
  { to: '/admin/inventory', icon: Package, label: '在庫管理' },
  { to: '/admin/stores', icon: Store, label: '店舗管理' },
]

export function AdminLayout() {
  const location = useLocation()
  const signOut = useSignOut()
  const { staff } = useCurrentStaff()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0',
          !sidebarOpen && '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <Scissors className="h-6 w-6 text-primary-600" />
          <span className="font-semibold text-lg text-gray-900">{APP_NAME}</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {staff && (
          <div className="border-t px-4 py-3">
            <p className="text-sm font-medium text-gray-900 truncate">{staff.display_name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[staff.role] ?? staff.role}</p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-white px-4 py-3 lg:px-6">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
