import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Card, CardContent, CardHeader, Badge, Select, Button, Input, Spinner } from '@/components/ui'
import { MapPin, Phone, Clock, ExternalLink, ArrowLeft, AlertTriangle } from 'lucide-react'
import { formatPrice, formatDateTimeJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'
import type { Store, Staff, Customer } from '@/types/models'

interface BusinessType { id: string; name: string; color: string }
interface StoreWithType extends Store { business_type?: BusinessType | null }
interface SaleRecord { id: string; amount: number; payment_method: string; paid_at: string; staff?: { display_name: string }; customer?: { name: string } | null }
interface SalesSummary { totalAmount: number; totalCount: number; byPaymentMethod: Record<string, { count: number; amount: number }> }
interface InventoryStock { id: string; quantity: number; min_quantity: number; item?: { name: string; category: string | null; unit: string; cost_price: number } }

const DAY_LABELS: Record<string, string> = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日' }
const PAYMENT_LABELS: Record<string, string> = { cash: '現金', paypay: 'PayPay', card: 'カード', other: 'その他' }
const TABS = ['概要', 'スタッフ', '顧客', '売上', '在庫'] as const
type Tab = typeof TABS[number]

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [tab, setTab] = useState<Tab>('概要')

  const { data: store, isLoading } = useQuery<StoreWithType>({
    queryKey: ['admin-store', storeId],
    queryFn: async () => {
      const stores = await api<StoreWithType[]>('/api/admin/stores')
      const found = stores.find(s => s.id === storeId)
      if (!found) throw new Error('Store not found')
      return found
    },
    enabled: !!storeId,
  })

  if (isLoading || !store) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/admin/stores"
          className="mt-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
            {store.business_type && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: store.business_type.color }}
              >
                {store.business_type.name}
              </span>
            )}
            <Badge className={store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
              {store.is_active ? '公開中' : '非公開'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">/{store.slug}</p>
        </div>
        <a
          href={`/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink className="h-3.5 w-3.5" /> LP
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === '概要' && <OverviewTab store={store} />}
      {tab === 'スタッフ' && <StaffTab storeId={store.id} />}
      {tab === '顧客' && <CustomerTab storeId={store.id} />}
      {tab === '売上' && <SalesTab storeId={store.id} />}
      {tab === '在庫' && <InventoryTab storeId={store.id} />}
    </div>
  )
}

// ─── Overview Tab ──────────────────

function OverviewTab({ store }: { store: StoreWithType }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(store.name)
  const [editSlug, setEditSlug] = useState(store.slug)
  const [editAddress, setEditAddress] = useState(store.address ?? '')
  const [editPhone, setEditPhone] = useState(store.phone ?? '')
  const [editDescription, setEditDescription] = useState(store.description ?? '')

  const { data: businessTypes } = useQuery<BusinessType[]>({
    queryKey: ['business-types'],
    queryFn: () => api<BusinessType[]>('/api/admin/business-types'),
  })

  const invalidateStore = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-store', store.id] })
    queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
  }

  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      await api(`/api/admin/stores/${store.id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
    },
    onSuccess: () => { invalidateStore(); toast.success('更新しました') },
  })

  const updateTypeMutation = useMutation({
    mutationFn: async (businessTypeId: string | null) => {
      await api(`/api/admin/stores/${store.id}`, { method: 'PATCH', body: JSON.stringify({ businessTypeId }) })
    },
    onSuccess: () => { invalidateStore(); toast.success('業種を更新しました') },
  })

  const updateInfoMutation = useMutation({
    mutationFn: async () => {
      await api(`/api/admin/stores/${store.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          address: editAddress.trim() || null,
          phone: editPhone.trim() || null,
          description: editDescription.trim() || null,
        }),
      })
    },
    onSuccess: () => {
      invalidateStore()
      toast.success('店舗情報を更新しました')
      setIsEditing(false)
    },
    onError: () => toast.error('更新に失敗しました'),
  })

  const startEditing = () => {
    setEditName(store.name)
    setEditSlug(store.slug)
    setEditAddress(store.address ?? '')
    setEditPhone(store.phone ?? '')
    setEditDescription(store.description ?? '')
    setIsEditing(true)
  }

  const hoursArray = (store as unknown as Record<string, unknown>).business_hours as Array<{ day_of_week: number; open_time: string; close_time: string }> | null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">基本情報</h3>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={startEditing}>編集</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Input label="店舗名" value={editName} onChange={e => setEditName(e.target.value)} />
                <Input label="スラッグ (URL)" value={editSlug} onChange={e => setEditSlug(e.target.value)} />
                <Input label="住所" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                <Input label="電話番号" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">紹介文</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => updateInfoMutation.mutate()} loading={updateInfoMutation.isPending}>
                    保存
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>キャンセル</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" /> {store.address ?? '未設定'}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" /> {store.phone ?? '未設定'}
                  </p>
                </div>
                {store.description && <p className="text-sm text-gray-600">{store.description}</p>}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <h3 className="flex items-center gap-1.5 font-semibold text-gray-900">
              <Clock className="h-4 w-4" /> 営業時間
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {Object.entries(DAY_LABELS).map(([dayNum, label]) => {
                const entry = hoursArray?.find(h => h.day_of_week === Number(dayNum))
                return (
                  <div key={dayNum} className={`rounded-lg p-2 text-center text-xs ${entry ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
                    <div className="font-medium">{label}</div>
                    {entry ? (<><div>{entry.open_time.slice(0, 5)}</div><div>〜</div><div>{entry.close_time.slice(0, 5)}</div></>) : <div className="mt-1">定休</div>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          {businessTypes && (
            <div className="w-48">
              <Select
                label="業種"
                value={store.business_type_id ?? ''}
                onChange={(e) => updateTypeMutation.mutate(e.target.value || null)}
                placeholder="未設定"
                options={businessTypes.map(bt => ({ value: bt.id, label: bt.name }))}
              />
            </div>
          )}
          <Button
            variant={store.is_active ? 'danger' : 'primary'}
            size="sm"
            onClick={() => toggleMutation.mutate(!store.is_active)}
          >
            {store.is_active ? '非公開にする' : '公開する'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Staff Tab ──────────────────

function StaffTab({ storeId }: { storeId: string }) {
  const { data: staffList, isLoading } = useQuery<Staff[]>({
    queryKey: ['admin-staff', storeId],
    queryFn: () => api<Staff[]>(`/api/admin/staff?storeId=${storeId}&activeOnly=false`),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>

  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-gray-900">スタッフ一覧</h2></CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">名前</th>
              <th className="px-4 py-3 font-medium text-gray-500">役職</th>
              <th className="px-4 py-3 font-medium text-gray-500">ロール</th>
              <th className="px-4 py-3 font-medium text-gray-500">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staffList?.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.display_name}</td>
                <td className="px-4 py-3 text-gray-600">{s.position ?? '-'}</td>
                <td className="px-4 py-3">
                  <Badge className="bg-primary-50 text-primary-700">{s.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {s.is_active ? '有効' : '無効'}
                  </Badge>
                </td>
              </tr>
            ))}
            {(!staffList || staffList.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">スタッフがいません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Customer Tab ──────────────────

function CustomerTab({ storeId }: { storeId: string }) {
  const [search, setSearch] = useState('')

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['admin-customers', search, storeId],
    queryFn: () => {
      const params = new URLSearchParams({ storeId })
      if (search.trim()) params.set('search', search.trim())
      return api<Customer[]>(`/api/admin/customers?${params}`)
    },
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名前・電話番号で検索..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">この店舗の顧客 ({customers?.length ?? 0}名)</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">氏名</th>
                <th className="px-4 py-3 font-medium text-gray-500">フリガナ</th>
                <th className="px-4 py-3 font-medium text-gray-500">電話番号</th>
                <th className="px-4 py-3 font-medium text-gray-500">来店回数</th>
                <th className="px-4 py-3 font-medium text-gray-500">最終来店</th>
                <th className="px-4 py-3 font-medium text-gray-500">流入元</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.name_kana ?? '-'}</td>
                  <td className="px-4 py-3">{c.phone ?? '-'}</td>
                  <td className="px-4 py-3">{((c as Record<string, unknown>).visit_count as number) ?? 0}回</td>
                  <td className="px-4 py-3">{(c as Record<string, unknown>).last_visit_at ? formatDateTimeJP((c as Record<string, unknown>).last_visit_at as string) : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.source ?? '-'}</td>
                </tr>
              ))}
              {(!customers || customers.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">この店舗の顧客はいません</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Sales Tab ──────────────────

function SalesTab({ storeId }: { storeId: string }) {
  const [startDate, setStartDate] = useState(getMonthStart())
  const [endDate, setEndDate] = useState(getToday())

  const { data: summary } = useQuery<SalesSummary>({
    queryKey: ['sales-summary', storeId, startDate, endDate],
    queryFn: () => api<SalesSummary>(`/api/admin/sales/summary?storeId=${storeId}&startDate=${startDate}&endDate=${endDate}`),
  })

  const { data: sales, isLoading } = useQuery<SaleRecord[]>({
    queryKey: ['sales', storeId, startDate, endDate],
    queryFn: () => api<SaleRecord[]>(`/api/admin/sales?storeId=${storeId}&startDate=${startDate}&endDate=${endDate}`),
  })

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <Input label="開始日" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="終了日" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </Card>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card><CardContent>
            <p className="text-sm font-medium text-gray-500">売上合計</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{formatPrice(summary.totalAmount)}</p>
            <p className="mt-1 text-xs text-gray-500">{summary.totalCount}件</p>
          </CardContent></Card>
          <Card><CardContent>
            <p className="text-sm font-medium text-gray-500">客単価</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {summary.totalCount > 0 ? formatPrice(Math.round(summary.totalAmount / summary.totalCount)) : '¥0'}
            </p>
          </CardContent></Card>
          <Card><CardContent>
            <p className="text-sm font-medium text-gray-500">決済種別</p>
            <div className="mt-2 space-y-1">
              {Object.entries(summary.byPaymentMethod).map(([m, { count, amount }]) => (
                <div key={m} className="flex justify-between text-sm">
                  <span className="text-gray-600">{PAYMENT_LABELS[m] ?? m} ({count}件)</span>
                  <span className="font-medium">{formatPrice(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-gray-900">売上一覧</h2></CardHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">日時</th>
                  <th className="px-4 py-3 font-medium text-gray-500">顧客</th>
                  <th className="px-4 py-3 font-medium text-gray-500">担当</th>
                  <th className="px-4 py-3 font-medium text-gray-500">決済</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales?.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTimeJP(s.paid_at)}</td>
                    <td className="px-4 py-3">{s.customer?.name ?? '-'}</td>
                    <td className="px-4 py-3">{s.staff?.display_name ?? '-'}</td>
                    <td className="px-4 py-3">{PAYMENT_LABELS[s.payment_method] ?? s.payment_method}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(s.amount)}</td>
                  </tr>
                ))}
                {(!sales || sales.length === 0) && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">売上データがありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Inventory Tab ──────────────────

function InventoryTab({ storeId }: { storeId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')

  const { data: stock, isLoading } = useQuery<InventoryStock[]>({
    queryKey: ['inventory-stock', storeId],
    queryFn: () => api<InventoryStock[]>(`/api/admin/inventory/stock?storeId=${storeId}`),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) =>
      api(`/api/admin/inventory/stock/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stock', storeId] })
      toast.success('在庫数を更新しました')
      setEditingId(null)
    },
    onError: () => toast.error('更新に失敗しました'),
  })

  const handleSave = (id: string) => {
    const qty = parseInt(editQty, 10)
    if (isNaN(qty) || qty < 0) { toast.error('有効な数値を入力してください'); return }
    updateMutation.mutate({ id, quantity: qty })
  }

  const grouped = (stock ?? []).reduce<Record<string, InventoryStock[]>>((acc, s) => {
    const cat = s.item?.category ?? 'その他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const lowStockCount = (stock ?? []).filter(s => s.quantity <= s.min_quantity).length

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>

  return (
    <div className="space-y-6">
      {lowStockCount > 0 && (
        <p className="flex items-center gap-1 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" /> {lowStockCount}件の在庫が少なくなっています
        </p>
      )}

      {Object.keys(grouped).length === 0 ? (
        <Card><div className="px-6 py-12 text-center text-sm text-gray-400">在庫データがありません</div></Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader><h2 className="text-lg font-semibold text-gray-900">{category}</h2></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">商品名</th>
                    <th className="px-4 py-3 font-medium text-gray-500">単位</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">在庫数</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">最低在庫</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">原価</th>
                    <th className="px-4 py-3 font-medium text-gray-500">状態</th>
                    <th className="px-4 py-3 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(s => {
                    const isLow = s.quantity <= s.min_quantity
                    const isEditing = editingId === s.id
                    return (
                      <tr key={s.id} className={isLow ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 font-medium">{s.item?.name ?? '-'}</td>
                        <td className="px-4 py-3">{s.item?.unit ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-20 text-right" />
                          ) : (
                            <span className={isLow ? 'font-bold text-amber-700' : ''}>{s.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{s.min_quantity}</td>
                        <td className="px-4 py-3 text-right">{s.item?.cost_price ? formatPrice(s.item.cost_price) : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                            {isLow ? '要補充' : '正常'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSave(s.id)} loading={updateMutation.isPending}>保存</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>取消</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => { setEditingId(s.id); setEditQty(String(s.quantity)) }}>編集</Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
