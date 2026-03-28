import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { Store } from '@/types/models'

interface HeroSectionProps {
  store: Store
}

export function HeroSection({ store }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-accent-50 py-20 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          {store.name}
        </h1>
        {store.description && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">{store.description}</p>
        )}
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to={`/${store.slug}/reserve`}>
            <Button size="lg">予約する</Button>
          </Link>
          <Link to={`/${store.slug}/menu`}>
            <Button variant="outline" size="lg">
              メニューを見る
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
