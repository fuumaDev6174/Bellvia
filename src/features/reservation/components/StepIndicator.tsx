import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < currentStep
                  ? 'bg-primary-600 text-white'
                  : i === currentStep
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600'
                    : 'bg-gray-100 text-gray-400',
              )}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'mt-1 text-xs hidden sm:block',
                i <= currentStep ? 'text-primary-700 font-medium' : 'text-gray-400',
              )}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-2 h-0.5 w-8 sm:w-12',
                i < currentStep ? 'bg-primary-600' : 'bg-gray-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
