import { useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'

export interface GuestInfo {
  name: string
  phone: string
  email: string
  notes: string
}

interface GuestInfoFormProps {
  initialValues?: GuestInfo
  onSubmit: (info: GuestInfo) => void
  onBack: () => void
}

export function GuestInfoForm({ initialValues, onSubmit, onBack }: GuestInfoFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'お名前を入力してください'
    if (!phone.trim()) newErrors.phone = '電話番号を入力してください'
    else if (!/^[\d-]{10,15}$/.test(phone.replace(/\s/g, '')))
      newErrors.phone = '有効な電話番号を入力してください'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = '有効なメールアドレスを入力してください'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim(), notes: notes.trim() })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">お客様情報</h3>
      <div className="space-y-4">
        <Input
          label="お名前 *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="山田 太郎"
        />
        <Input
          label="電話番号 *"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          placeholder="090-1234-5678"
        />
        <Input
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="example@email.com"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="ご要望やご質問があればお書きください"
          />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button type="submit" className="flex-1">
          確認画面へ
        </Button>
      </div>
    </form>
  )
}
