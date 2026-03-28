import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { STAFF_ROLES } from '@/types/models'
import { ROLE_LABELS } from '@/lib/constants'
import { useUpdateStaff } from '../hooks/useStaff'
import type { Staff } from '@/types/models'

interface StaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
}

export function StaffFormModal({ isOpen, onClose, staff }: StaffFormModalProps) {
  const updateStaff = useUpdateStaff()

  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<string>('stylist')
  const [position, setPosition] = useState('')
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (isOpen && staff) {
      setDisplayName(staff.display_name)
      setRole(staff.role)
      setPosition(staff.position ?? '')
      setBio(staff.bio ?? '')
      setSpecialties(Array.isArray(staff.specialties) ? staff.specialties.join(', ') : '')
      setIsActive(staff.is_active ?? true)
    }
  }, [isOpen, staff])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!staff) return

    const specialtiesArray = specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      await updateStaff.mutateAsync({
        id: staff.id,
        display_name: displayName.trim(),
        role,
        position: position.trim() || null,
        bio: bio.trim() || null,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : [],
        is_active: isActive,
      })
      onClose()
    } catch {
      // Error handled by mutation onError
    }
  }

  const roleOptions = STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="スタッフ編集" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="表示名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <Select
          label="役割"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={roleOptions}
        />

        <Input
          label="役職"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="例: チーフスタイリスト"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <Input
          label="得意技術（カンマ区切り）"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          placeholder="例: カット, カラー, ヘッドスパ"
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          アクティブ
        </label>

        <p className="text-xs text-gray-400">
          ※ 新しいスタッフの追加はアカウント作成が必要なため、Phase 1 では編集のみ対応しています。
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" loading={updateStaff.isPending}>
            更新
          </Button>
        </div>
      </form>
    </Modal>
  )
}
