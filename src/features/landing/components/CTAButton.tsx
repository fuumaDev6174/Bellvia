import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

interface CTAButtonProps {
  storeSlug: string
}

export function CTAButton({ storeSlug }: CTAButtonProps) {
  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50 text-center">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="text-2xl font-bold text-gray-900">
          ご予約はこちらから
        </h2>
        <p className="mt-2 text-gray-600">
          Web予約なら24時間いつでもご予約いただけます
        </p>
        <Link to={`/${storeSlug}/reserve`} className="mt-6 inline-block">
          <Button size="lg">今すぐ予約する</Button>
        </Link>
      </div>
    </section>
  )
}
