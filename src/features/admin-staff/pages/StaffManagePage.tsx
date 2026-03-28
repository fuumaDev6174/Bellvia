import { useState } from 'react'
import { Pencil, User } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ROLE_LABELS } from '@/lib/constants'
import { useStaff, useUpdateStaff } from '../hooks/useStaff'
import { StaffFormModal } from '../components/StaffFormModal'
import type { Staff } from '@/types/models'

export default function StaffManagePage() {
  const { data: staffList, isLoading } = useStaff()
  const updateStaff = useUpdateStaff()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  function handleEdit(staff: Staff) {
    setEditingStaff(staff)
    setModalOpen(true)
  }

  function handleToggleActive(staff: Staff) {
    updateStaff.mutate({ id: staff.id, is_active: !staff.is_active })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">スタッフ管理</h1>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">全{staffList?.length ?? 0}名</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">スタッフ</th>
                  <th className="px-4 py-3 font-medium">役割</th>
                  <th className="px-4 py-3 font-medium">役職</th>
                  <th className="px-4 py-3 font-medium">得意技術</th>
                  <th className="px-4 py-3 font-medium text-center">ステータス</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffList?.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {staff.photo_url ? (
                          <img
                            src={staff.photo_url}
                            alt={staff.display_name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{staff.display_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ROLE_LABELS[staff.role] ?? staff.role}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{staff.position ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(staff.specialties) && staff.specialties.length > 0 ? (
                          staff.specialties.map((s: string) => (
                            <Badge key={s} className="bg-gray-100 text-gray-700">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(staff)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          staff.is_active ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            staff.is_active ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {staffList?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      スタッフがまだ登録されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <StaffFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} staff={editingStaff} />
    </div>
  )
}
