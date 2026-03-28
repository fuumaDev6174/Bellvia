import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui'
import type { StaffRole } from '@/types/models'

interface AuthGuardProps {
  children: React.ReactNode
  roles?: StaffRole[]
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { session, currentStaff, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!currentStaff) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">アクセス権限がありません。管理者にお問い合わせください。</p>
      </div>
    )
  }

  if (roles && !roles.includes(currentStaff.role as StaffRole)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">このページへのアクセス権限がありません。</p>
      </div>
    )
  }

  return <>{children}</>
}
