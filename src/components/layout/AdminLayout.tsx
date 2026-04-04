import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Users,
  UserCircle,
  Store as StoreIcon,
  JapaneseYen,
  Package,
  Tags,
  LogOut,
  Menu as MenuIcon,
  Scissors,
  Eye,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSignOut } from '@/hooks/useAuth'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import { useStoreContext } from '@/hooks/useStoreContext'
import { useUIStore } from '@/stores/uiStore'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { APP_NAME, ROLE_LABELS } from '@/lib/constants'
import type { Store } from '@/types/models'
import type { StaffRole } from '@/types/models'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  exact?: boolean
  roles?: StaffRole[]
}

const navItems: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'ダッシュボード', exact: true },
  { to: '/admin/reservations', icon: CalendarDays, label: '予約管理', roles: ['company_admin', 'store_manager'] },
  { to: '/admin/menus', icon: UtensilsCrossed, label: 'メニュー管理', roles: ['company_admin', 'store_manager'] },
  { to: '/admin/staff', icon: Users, label: 'スタッフ管理', roles: ['company_admin', 'store_manager'] },
  { to: '/admin/customers', icon: UserCircle, label: '顧客一覧', roles: ['company_admin', 'store_manager'] },
  { to: '/admin/sales', icon: JapaneseYen, label: '売上管理', roles: ['company_admin', 'store_manager'] },
  { to: '/admin/inventory', icon: Package, label: '在庫管理', roles: ['company_admin', 'store_manager'] },
  { to: '/admin/stores', icon: StoreIcon, label: '店舗管理', roles: ['company_admin'] },
  { to: '/admin/business-types', icon: Tags, label: '業種管理', roles: ['company_admin'] },
]

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '会社管理者（本来のロール）' },
  { value: 'store_manager', label: '店長として表示' },
  { value: 'stylist', label: 'スタイリストとして表示' },
]

export function AdminLayout() {
  const location = useLocation()
  const signOut = useSignOut()
  const { staff, role, actualRole, isOverriding } = useCurrentStaff()
  const { activeStoreId, setSelectedStoreId, canSwitchStore } = useStoreContext()
  const { sidebarOpen, toggleSidebar, roleOverride, setRoleOverride } = useUIStore()

  const { data: stores } = useQuery<Store[]>({
    queryKey: ['admin-stores'],
    queryFn: () => api<Store[]>('/api/admin/stores'),
    enabled: canSwitchStore,
  })

  // Filter nav items by effective role
  const visibleNav = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Override banner */}
      {isOverriding && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-white">
          <Eye className="h-4 w-4" />
          <span>{ROLE_LABELS[roleOverride ?? ''] ?? roleOverride} ビューでプレビュー中</span>
          <button
            onClick={() => setRoleOverride(null)}
            className="rounded bg-amber-600 px-2 py-0.5 text-xs hover:bg-amber-700"
          >
            解除
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0',
          !sidebarOpen && '-translate-x-full',
          isOverriding && 'pt-9',
        )}
      >
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <Scissors className="h-6 w-6 text-primary-600" />
          <span className="font-semibold text-lg text-gray-900">{APP_NAME}</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
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
            <p className="text-xs text-gray-500">
              {ROLE_LABELS[role ?? ''] ?? role}
              {isOverriding && <span className="ml-1 text-amber-600">（プレビュー）</span>}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Main content */}
      <div className={cn('flex-1 flex flex-col min-w-0', isOverriding && 'pt-9')}>
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3 lg:px-6"
          style={isOverriding ? { top: '36px' } : undefined}
        >
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* Store selector (admin only) */}
          {canSwitchStore && stores && (
            <select
              value={activeStoreId ?? ''}
              onChange={(e) => setSelectedStoreId?.(e.target.value || null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <div className="flex-1" />

          {/* Role switcher (company_admin only) */}
          {actualRole === 'company_admin' && (
            <select
              value={roleOverride ?? ''}
              onChange={(e) => setRoleOverride((e.target.value || null) as StaffRole | null)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500',
                isOverriding
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-300 text-gray-700',
              )}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

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
