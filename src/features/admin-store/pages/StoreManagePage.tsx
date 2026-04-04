import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, Select } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { MapPin, Phone, Search, X } from 'lucide-react'
import type { Store } from '@/types/models'

interface BusinessType { id: string; name: string; color: string }
interface StoreWithType extends Store { business_type?: BusinessType | null }

export default function StoreManagePage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const { data: stores, isLoading } = useQuery<StoreWithType[]>({
    queryKey: ['admin-stores'],
    queryFn: () => api<StoreWithType[]>('/api/admin/stores'),
  })

  const { data: businessTypes } = useQuery<BusinessType[]>({
    queryKey: ['business-types'],
    queryFn: () => api<BusinessType[]>('/api/admin/business-types'),
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
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">店舗管理</h1>
        <p className="mt-1 text-sm text-gray-500">{filtered.length} / {stores?.length ?? 0}店舗</p>
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
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Select label="業種" value={filterType} onChange={(e) => setFilterType(e.target.value)} placeholder="すべて"
            options={(businessTypes ?? []).map((bt) => ({ value: bt.id, label: bt.name }))} />
          <Select label="ステータス" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} placeholder="すべて"
            options={[{ value: 'active', label: '公開中' }, { value: 'inactive', label: '非公開' }]} />
          {hasFilters && (
            <button onClick={resetFilters} className="mb-0.5 text-sm text-primary-600 hover:text-primary-700">リセット</button>
          )}
        </div>
      </Card>

      {/* Store cards grouped by business type */}
      {filtered.length === 0 ? (
        <Card><div className="px-6 py-12 text-center text-sm text-gray-400">該当する店舗がありません</div></Card>
      ) : (
        grouped.map(({ type, stores: groupStores }) => (
          <div key={type?.id ?? '__none__'} className="space-y-3">
            <div className="flex items-center gap-3">
              {type ? (
                <>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: type.color }}>
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
                <Link
                  key={store.id}
                  to={`/admin/stores/${store.id}`}
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
                      <MapPin className="h-3 w-3 shrink-0" /> {store.address}
                    </p>
                  )}
                  {store.phone && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 truncate mt-0.5">
                      <Phone className="h-3 w-3 shrink-0" /> {store.phone}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
