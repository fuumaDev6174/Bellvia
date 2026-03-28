import { Outlet, Link, useParams } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export function PublicLayout() {
  const { storeSlug } = useParams()
  const basePath = storeSlug ? `/${storeSlug}` : '/'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <Link to={basePath} className="flex items-center gap-2 text-primary-700 font-semibold text-xl">
            <Scissors className="h-6 w-6" />
            {APP_NAME}
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {storeSlug && (
              <>
                <Link to={`/${storeSlug}`} className="hover:text-primary-600 transition-colors">
                  トップ
                </Link>
                <Link to={`/${storeSlug}/menu`} className="hover:text-primary-600 transition-colors">
                  メニュー
                </Link>
                <Link to={`/${storeSlug}/stylists`} className="hover:text-primary-600 transition-colors">
                  スタイリスト
                </Link>
                <Link
                  to={`/${storeSlug}/reserve`}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 transition-colors"
                >
                  予約する
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
