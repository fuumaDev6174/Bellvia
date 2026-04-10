import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { MENU_CATEGORIES } from '@/types/models'
import { useCreateMenu, useUpdateMenu } from '../hooks/useMenus'
import type { Menu } from '@/types/models'

interface MenuFormModalProps {
  isOpen: boolean
  onClose: () => void
  menu?: Menu | null
}

export function MenuFormModal({ isOpen, onClose, menu }: MenuFormModalProps) {
  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()
  const isEdit = !!menu

  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(MENU_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [workloadPoints, setWorkloadPoints] = useState('1.0')
  const [isPublic, setIsPublic] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      if (menu) {
        setName(menu.name)
        setCategory(menu.category ?? MENU_CATEGORIES[0])
        setDescription(menu.description ?? '')
        setPrice(String(menu.price))
        setDurationMin(String(menu.duration_min))
        setWorkloadPoints(String(menu.workload_points ?? 1.0))
        setIsPublic(menu.is_public ?? true)
      } else {
        setName('')
        setCategory(MENU_CATEGORIES[0])
        setDescription('')
        setPrice('')
        setDurationMin('')
        setWorkloadPoints('1.0')
        setIsPublic(true)
      }
      setErrors({})
    }
  }, [isOpen, menu])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'メニュー名は必須です'
    if (!price || Number(price) < 0) newErrors.price = '正しい金額を入力してください'
    if (!durationMin || Number(durationMin) <= 0) newErrors.durationMin = '正しい所要時間を入力してください'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      category,
      description: description.trim() || null,
      price: Number(price),
      duration_min: Number(durationMin),
      workload_points: Number(workloadPoints),
      is_public: isPublic,
    }

    try {
      if (isEdit && menu) {
        await updateMenu.mutateAsync({ id: menu.id, ...payload })
      } else {
        await createMenu.mutateAsync(payload)
      }
      onClose()
    } catch {
      // Error handled by mutation onError
    }
  }

  const isSubmitting = createMenu.isPending || updateMenu.isPending
  const categoryOptions = MENU_CATEGORIES.map((c) => ({ value: c, label: c }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'メニュー編集' : '新しいメニュー'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="メニュー名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <Select
          label="カテゴリ"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categoryOptions}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="料金（円）"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.price}
            required
          />
          <Input
            label="所要時間（分）"
            type="number"
            min={1}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            error={errors.durationMin}
            required
          />
          <Input
            label="仕事量ポイント"
            type="number"
            min={0}
            step={0.1}
            value={workloadPoints}
            onChange={(e) => setWorkloadPoints(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          公開する
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
