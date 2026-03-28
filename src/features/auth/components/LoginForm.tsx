import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useSignIn } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const signIn = useSignIn()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch {
      toast.error('メールアドレスまたはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <Input
        label="メールアドレス"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@example.com"
        autoComplete="email"
      />
      <Input
        label="パスワード"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
      />
      <Button type="submit" loading={loading} className="w-full">
        ログイン
      </Button>
    </form>
  )
}
