import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Scissors } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { LoginForm } from '../components/LoginForm'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Scissors className="mx-auto h-10 w-10 text-primary-600" />
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-500">管理画面にログイン</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
