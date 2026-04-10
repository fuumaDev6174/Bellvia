import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
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
  Search,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Boxes,
  Clock,
  Activity,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSignOut } from '@/hooks/useAuth'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import { useStoreContext } from '@/hooks/useStoreContext'
import { useUIStore } from '@/stores/uiStore'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { APP_NAME, ROLE_LABELS } from '@/lib/constants'
import { Modal, Button } from '@/components/ui'
import type { Store } from '@/types/models'
import type { StaffRole } from '@/types/models'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  exact?: boolean
  roles?: StaffRole[]
  children?: NavItem[]
  separator?: boolean // show separator line before this item
}

// company_admin nav: store management is a parent with children
const adminNav: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'ダッシュボード', exact: true },
  {
    to: '/admin/stores',
    icon: StoreIcon,
    label: '店舗管理',
    children: [
      { to: '/admin/reservations', icon: CalendarDays, label: '予約管理' },
      { to: '/admin/menus', icon: UtensilsCrossed, label: 'メニュー管理' },
      { to: '/admin/staff', icon: Users, label: 'スタッフ管理' },
      { to: '/admin/sales', icon: JapaneseYen, label: '売上管理' },
      { to: '/admin/inventory', icon: Package, label: '在庫管理' },
      { to: '/admin/customers', icon: UserCircle, label: '顧客管理' },
      { to: '/admin/attendance', icon: Clock, label: '勤怠管理' },
      { to: '/admin/workload', icon: Activity, label: '仕事量' },
    ],
  },
  { to: '/admin/customers-all', icon: UserCircle, label: '顧客一覧（全社）', separator: true },
  { to: '/admin/sales-overview', icon: BarChart3, label: '売上総括' },
  { to: '/admin/inventory-overview', icon: Boxes, label: '在庫総括' },
  { to: '/admin/business-types', icon: Tags, label: '業種管理' },
]

// store_manager nav: flat, no store/business-type management
const managerNav: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'ダッシュボード', exact: true },
  { to: '/admin/reservations', icon: CalendarDays, label: '予約管理' },
  { to: '/admin/menus', icon: UtensilsCrossed, label: 'メニュー管理' },
  { to: '/admin/staff', icon: Users, label: 'スタッフ管理' },
  { to: '/admin/sales', icon: JapaneseYen, label: '売上管理' },
  { to: '/admin/inventory', icon: Package, label: '在庫管理' },
  { to: '/admin/customers', icon: UserCircle, label: '顧客一覧' },
  { to: '/admin/attendance', icon: Clock, label: '勤怠管理' },
  { to: '/admin/workload', icon: Activity, label: '仕事量' },
]

// stylist nav: dashboard only
const stylistNav: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'ダッシュボード', exact: true },
]

const CHILD_PATHS = ['/admin/reservations', '/admin/menus', '/admin/staff', '/admin/sales', '/admin/inventory', '/admin/customers', '/admin/attendance', '/admin/workload']

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'store_manager', label: '店長として表示' },
  { value: 'stylist', label: 'スタイリストとして表示' },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const { staff, role, actualRole, isOverriding } = useCurrentStaff()
  const { activeStoreId, setSelectedStoreId, canSwitchStore } = useStoreContext()
  const { sidebarOpen, toggleSidebar, roleOverride, overrideStoreId, clearOverride } = useUIStore()
  const setRoleOverride = useUIStore((s) => s.setRoleOverride)

  const [pickingRole, setPickingRole] = useState<StaffRole | null>(null)
  const [storeSearch, setStoreSearch] = useState('')

  // Store management expanded state
  const isStoreExpanded =
    location.pathname.startsWith('/admin/stores') ||
    CHILD_PATHS.some((p) => location.pathname.startsWith(p))

  const { data: stores } = useQuery<Store[]>({
    queryKey: ['admin-stores'],
    queryFn: () => api<Store[]>('/api/admin/stores'),
    enabled: actualRole === 'company_admin',
  })

  // Pick nav by role
  const navItems = role === 'company_admin' ? adminNav
    : role === 'store_manager' ? managerNav
    : stylistNav

  const handleRoleSelect = (selectedRole: StaffRole) => {
    setPickingRole(selectedRole)
    setStoreSearch('')
  }

  const handleStoreSelect = (storeId: string) => {
    if (!pickingRole) return
    setRoleOverride(pickingRole, storeId)
    setPickingRole(null)
    setStoreSearch('')
    navigate('/admin')
  }

  const handleClearOverride = () => {
    clearOverride()
    navigate('/admin')
  }

  const filteredStores = (stores ?? []).filter((s) => {
    if (!storeSearch) return true
    const q = storeSearch.toLowerCase()
    return s.name.toLowerCase().includes(q) || (s.address ?? '').toLowerCase().includes(q)
  })

  const overrideStoreName = stores?.find((s) => s.id === overrideStoreId)?.name
  const activeStoreName = stores?.find((s) => s.id === activeStoreId)?.name

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Override banner */}
      {isOverriding && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-white">
          <Eye className="h-4 w-4" />
          <span>
            <span className="font-bold">{overrideStoreName}</span> の{ROLE_LABELS[roleOverride ?? ''] ?? roleOverride}ビューでプレビュー中
          </span>
          <button onClick={handleClearOverride} className="rounded bg-amber-600 px-2 py-0.5 text-xs hover:bg-amber-700">
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
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

            const separator = item.separator ? (
              <div className="my-3 border-t border-gray-200" />
            ) : null

            if (hasChildren) {
              return (
                <div key={item.to}>
                  {separator}
                  {/* Parent: 店舗管理 */}
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isStoreExpanded
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {isStoreExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Link>

                  {/* Children */}
                  {isStoreExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
                      {/* Show active store name */}
                      {activeStoreName && (
                        <p className="px-2 py-1 text-xs font-medium text-primary-600 truncate">
                          {activeStoreName}
                        </p>
                      )}
                      {item.children!.map((child) => {
                        const childActive = location.pathname.startsWith(child.to)
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors',
                              childActive
                                ? 'bg-primary-50 font-medium text-primary-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={item.to}>
                {separator}
                <Link
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
              </div>
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
        <header
          className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3 lg:px-6"
          style={isOverriding ? { top: '36px' } : undefined}
        >
          <button onClick={toggleSidebar} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden">
            <MenuIcon className="h-5 w-5" />
          </button>

          {canSwitchStore && !isOverriding && stores && (
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

          {actualRole === 'company_admin' && !isOverriding && (
            <div className="flex gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRoleSelect(opt.value)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
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

      {/* Store picker modal */}
      <Modal
        isOpen={pickingRole !== null}
        onClose={() => setPickingRole(null)}
        title={`${ROLE_LABELS[pickingRole ?? ''] ?? ''}として表示する店舗を選択`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              placeholder="店舗名・住所で検索..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto divide-y rounded-lg border">
            {filteredStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreSelect(store.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{store.name}</p>
                  {store.address && <p className="text-xs text-gray-500">{store.address}</p>}
                </div>
                <span className={`h-2 w-2 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
              </button>
            ))}
            {filteredStores.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">該当する店舗がありません</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPickingRole(null)}>キャンセル</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
