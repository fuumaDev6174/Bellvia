import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Card, Badge, Select, Modal, Button } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { MapPin, Phone, Clock, ExternalLink, Search, X } from 'lucide-react'
import type { Store, BusinessHours, BusinessHourEntry } from '@/types/models'

interface BusinessType {
  id: string
  name: string
  color: string
}

interface StoreWithType extends Store {
  business_type?: BusinessType | null
}

const DAY_LABELS: Record<string, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日',
}

export default function StoreManagePage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedStore, setSelectedStore] = useState<StoreWithType | null>(null)

  const { data: stores, isLoading } = useQuery<StoreWithType[]>({
    queryKey: ['admin-stores'],
    queryFn: () => api<StoreWithType[]>('/api/admin/stores'),
  })

  const { data: businessTypes } = useQuery<BusinessType[]>({
    queryKey: ['business-types'],
    queryFn: () => api<BusinessType[]>('/api/admin/business-types'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api(`/api/admin/stores/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('店舗の状態を更新しました')
    },
    onError: () => toast.error('更新に失敗しました'),
  })

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, businessTypeId }: { id: string; businessTypeId: string | null }) => {
      await api(`/api/admin/stores/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ businessTypeId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('業種を更新しました')
    },
    onError: () => toast.error('更新に失敗しました'),
  })

  const filtered = useMemo(() => {
    if (!stores) return []
    return stores.filter((s) => {
      const q = search.toLowerCase()
      if (q && !(
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.address ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        (s.business_type?.name ?? '').toLowerCase().includes(q)
      )) return false
      if (filterType && s.business_type_id !== filterType) return false
      if (filterStatus === 'active' && !s.is_active) return false
      if (filterStatus === 'inactive' && s.is_active) return false
      return true
    })
  }, [stores, search, filterType, filterStatus])

  const grouped = useMemo(() => {
    const map = new Map<string, { type: BusinessType | null; stores: StoreWithType[] }>()
    for (const s of filtered) {
      const key = s.business_type?.id ?? '__none__'
      if (!map.has(key)) map.set(key, { type: s.business_type ?? null, stores: [] })
      map.get(key)!.stores.push(s)
    }
    return Array.from(map.values())
  }, [filtered])

  const hasFilters = search || filterType || filterStatus
  const resetFilters = () => { setSearch(''); setFilterType(''); setFilterStatus('') }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">店舗管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          {filtered.length} / {stores?.length ?? 0}店舗
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">キーワード検索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="店舗名・住所・電話番号・業種..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Select
            label="業種"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            placeholder="すべて"
            options={(businessTypes ?? []).map((bt) => ({ value: bt.id, label: bt.name }))}
          />
          <Select
            label="ステータス"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            placeholder="すべて"
            options={[
              { value: 'active', label: '公開中' },
              { value: 'inactive', label: '非公開' },
            ]}
          />
          {hasFilters && (
            <button onClick={resetFilters} className="mb-0.5 text-sm text-primary-600 hover:text-primary-700">
              リセット
            </button>
          )}
        </div>
      </Card>

      {/* Store cards grouped by business type */}
      {filtered.length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center text-sm text-gray-400">該当する店舗がありません</div>
        </Card>
      ) : (
        grouped.map(({ type, stores: groupStores }) => (
          <div key={type?.id ?? '__none__'} className="space-y-3">
            <div className="flex items-center gap-3">
              {type ? (
                <>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: type.color }}
                  >
                    {type.name}
                  </span>
                  <span className="text-sm text-gray-500">{groupStores.length}店舗</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-500">業種未設定</span>
                  <span className="text-sm text-gray-400">{groupStores.length}店舗</span>
                </>
              )}
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {groupStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className="rounded-xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">{store.name}</h3>
                    <span
                      className={`shrink-0 h-2 w-2 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={store.is_active ? '公開中' : '非公開'}
                    />
                  </div>
                  {store.address && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {store.address}
                    </p>
                  )}
                  {store.phone && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 truncate mt-0.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      {store.phone}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Store detail modal */}
      <StoreDetailModal
        store={selectedStore}
        businessTypes={businessTypes ?? []}
        onClose={() => setSelectedStore(null)}
        onToggleActive={(id, isActive) => toggleActiveMutation.mutate({ id, isActive })}
        onUpdateType={(id, businessTypeId) => updateTypeMutation.mutate({ id, businessTypeId })}
      />
    </div>
  )
}

// ─── Detail Modal ──────────────────────────────

interface StoreDetailModalProps {
  store: StoreWithType | null
  businessTypes: BusinessType[]
  onClose: () => void
  onToggleActive: (id: string, isActive: boolean) => void
  onUpdateType: (id: string, businessTypeId: string | null) => void
}

function StoreDetailModal({ store, businessTypes, onClose, onToggleActive, onUpdateType }: StoreDetailModalProps) {
  if (!store) return null

  return (
    <Modal isOpen={!!store} onClose={onClose} title="店舗詳細" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
            <p className="text-sm text-gray-500">/{store.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            {store.business_type && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: store.business_type.color }}
              >
                {store.business_type.name}
              </span>
            )}
            <Badge
              className={store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
            >
              {store.is_active ? '公開中' : '非公開'}
            </Badge>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">住所</p>
            <p className="flex items-center gap-1.5 font-medium text-gray-900">
              <MapPin className="h-4 w-4 text-gray-400" />
              {store.address ?? '未設定'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">電話番号</p>
            <p className="flex items-center gap-1.5 font-medium text-gray-900">
              <Phone className="h-4 w-4 text-gray-400" />
              {store.phone ?? '未設定'}
            </p>
          </div>
        </div>

        {/* Description */}
        {store.description && (
          <div>
            <p className="text-sm text-gray-500 mb-1">紹介文</p>
            <p className="text-sm text-gray-900">{store.description}</p>
          </div>
        )}

        {/* Business hours */}
        <div>
          <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Clock className="h-4 w-4" />
            営業時間
          </p>
          <div className="grid grid-cols-7 gap-1">
            {Object.entries(DAY_LABELS).map(([key, label]) => {
              const hours = store.business_hours as BusinessHours | null
              const entry = hours?.[key] as BusinessHourEntry | null | undefined
              return (
                <div
                  key={key}
                  className={`rounded-lg p-2 text-center text-xs ${
                    entry ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  {entry ? (
                    <>
                      <div>{entry.open}</div>
                      <div>〜</div>
                      <div>{entry.close}</div>
                    </>
                  ) : (
                    <div className="mt-1">定休</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Business type selector */}
        <Select
          label="業種"
          value={store.business_type_id ?? ''}
          onChange={(e) => onUpdateType(store.id, e.target.value || null)}
          placeholder="未設定"
          options={businessTypes.map((bt) => ({ value: bt.id, label: bt.name }))}
        />

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-3">
            <Button
              variant={store.is_active ? 'danger' : 'primary'}
              size="sm"
              onClick={() => onToggleActive(store.id, !store.is_active)}
            >
              {store.is_active ? '非公開にする' : '公開する'}
            </Button>
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LPを見る
            </a>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  )
}
