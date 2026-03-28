import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTimeJP } from '@/lib/utils'
import { useCustomers } from '../hooks/useCustomers'
import { CustomerDetailModal } from '../components/CustomerDetailModal'
import type { Customer } from '@/types/models'

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default function CustomerListPage() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const { data: customers, isLoading } = useCustomers(debouncedSearch)

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleRowClick(customer: Customer) {
    setSelectedCustomer(customer)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="名前・電話番号で検索..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8 text-primary-600" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <p className="text-sm text-gray-500">全{customers?.length ?? 0}件</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">氏名</th>
                    <th className="px-4 py-3 font-medium">フリガナ</th>
                    <th className="px-4 py-3 font-medium">電話番号</th>
                    <th className="px-4 py-3 font-medium">メール</th>
                    <th className="px-4 py-3 font-medium text-right">来店回数</th>
                    <th className="px-4 py-3 font-medium">最終来店</th>
                    <th className="px-4 py-3 font-medium">流入元</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers?.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(customer)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3 text-gray-700">{customer.name_kana ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{customer.phone ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{customer.email ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {customer.visit_count ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {customer.last_visit_at ? formatDateTimeJP(customer.last_visit_at) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{customer.source ?? '-'}</td>
                    </tr>
                  ))}
                  {customers?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        {debouncedSearch ? '該当する顧客が見つかりません' : '顧客がまだ登録されていません'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CustomerDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  )
}
