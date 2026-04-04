import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, ChevronDown, X } from 'lucide-react'
import type { Store } from '@/types/models'

interface StoreSelectorProps {
  value: string | null
  onChange: (storeId: string | null) => void
  allowAll?: boolean
  label?: string
}

export function StoreSelector({ value, onChange, allowAll = true, label = '店舗' }: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const { data: stores } = useQuery<Store[]>({
    queryKey: ['admin-stores'],
    queryFn: () => api<Store[]>('/api/admin/stores'),
  })

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = (stores ?? []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()) ||
    (s.address ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const selectedStore = stores?.find((s) => s.id === value)
  const displayText = value === null && allowAll
    ? '全店舗（総括）'
    : selectedStore?.name ?? '店舗を選択'

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <span className={value === null && !allowAll ? 'text-gray-400' : 'text-gray-900'}>
          {displayText}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="店舗名・住所で検索..."
                className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto py-1">
            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                  setSearch('')
                }}
                className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                  value === null ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-900'
                }`}
              >
                全店舗（総括）
              </button>
            )}
            {filtered.map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  onChange(store.id)
                  setIsOpen(false)
                  setSearch('')
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                  value === store.id ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-900'
                }`}
              >
                <span>{store.name}</span>
                {store.address && (
                  <span className="ml-2 text-xs text-gray-400 truncate max-w-[150px]">
                    {store.address}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-gray-400">
                該当する店舗がありません
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
