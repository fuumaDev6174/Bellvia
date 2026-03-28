import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { SEOHead } from '@/components/layout/SEOHead'
import { Spinner, Button } from '@/components/ui'
import { useStoreBySlug } from '@/features/landing/hooks/useStoreBySlug'
import { usePublicMenus } from '@/features/landing/hooks/usePublicMenus'
import { usePublicStylists } from '@/features/landing/hooks/usePublicStylists'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { useCreateReservation } from '../hooks/useCreateReservation'
import { StepIndicator } from '../components/StepIndicator'
import { MenuSelect } from '../components/MenuSelect'
import { StylistSelect } from '../components/StylistSelect'
import { DatePicker } from '../components/DatePicker'
import { TimeSlotGrid } from '../components/TimeSlotGrid'
import { GuestInfoForm, type GuestInfo } from '../components/GuestInfoForm'
import { ConfirmationSummary } from '../components/ConfirmationSummary'
import type { Menu, Staff, AvailableSlot } from '@/types/models'

const STEPS = ['メニュー', 'スタイリスト', '日付', '時間', 'お客様情報', '確認']

export default function ReservationPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const { data: store, isLoading: storeLoading } = useStoreBySlug(storeSlug)
  const { data: menus } = usePublicMenus(store?.id)
  const { data: stylists } = usePublicStylists(store?.id)

  const [step, setStep] = useState(0)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)

  const { data: slots, isLoading: slotsLoading } = useAvailableSlots({
    storeId: store?.id,
    date: selectedDate ?? undefined,
    menuId: selectedMenu?.id,
    staffId: selectedStylistId,
  })

  const createReservation = useCreateReservation()

  const selectedStylist: Staff | null =
    stylists?.find((s) => s.id === (selectedSlot?.staff_id ?? selectedStylistId)) ?? null

  if (storeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">店舗が見つかりません</p>
      </div>
    )
  }

  async function handleConfirm() {
    if (!store || !selectedMenu || !selectedSlot || !guestInfo) return

    try {
      const result = await createReservation.mutateAsync({
        storeId: store.id,
        staffId: selectedSlot.staff_id,
        menuId: selectedMenu.id,
        startAt: selectedSlot.time,
        guestName: guestInfo.name,
        guestPhone: guestInfo.phone,
        guestEmail: guestInfo.email || undefined,
        notes: guestInfo.notes || undefined,
      })

      navigate(`/${storeSlug}/reserve/confirm`, {
        state: { reservation: result },
        replace: true,
      })
    } catch {
      toast.error('予約に失敗しました。時間帯が埋まった可能性があります。')
    }
  }

  return (
    <>
      <SEOHead title={`予約 - ${store.name}`} description={`${store.name}のWeb予約`} />

      <section className="py-8">
        <div className="mx-auto max-w-xl px-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Web予約</h1>
          <StepIndicator steps={STEPS} currentStep={step} />

          {step === 0 && menus && (
            <div>
              <MenuSelect
                menus={menus}
                selectedId={selectedMenu?.id ?? null}
                onSelect={(menu) => {
                  setSelectedMenu(menu)
                  // Reset downstream selections
                  setSelectedDate(null)
                  setSelectedSlot(null)
                }}
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(1)} disabled={!selectedMenu}>
                  次へ
                </Button>
              </div>
            </div>
          )}

          {step === 1 && stylists && (
            <div>
              <StylistSelect
                stylists={stylists}
                selectedId={selectedStylistId}
                onSelect={(id) => {
                  setSelectedStylistId(id)
                  setSelectedDate(null)
                  setSelectedSlot(null)
                }}
              />
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>
                  戻る
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1">
                  次へ
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  setSelectedSlot(null)
                }}
              />
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  戻る
                </Button>
                <Button onClick={() => setStep(3)} disabled={!selectedDate}>
                  次へ
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <TimeSlotGrid
                slots={slots ?? []}
                isLoading={slotsLoading}
                selectedTime={selectedSlot?.time ?? null}
                onSelect={(slot) => setSelectedSlot(slot)}
              />
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  戻る
                </Button>
                <Button onClick={() => setStep(4)} disabled={!selectedSlot}>
                  次へ
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <GuestInfoForm
              initialValues={guestInfo ?? undefined}
              onSubmit={(info) => {
                setGuestInfo(info)
                setStep(5)
              }}
              onBack={() => setStep(3)}
            />
          )}

          {step === 5 && selectedMenu && selectedSlot && guestInfo && (
            <ConfirmationSummary
              store={store}
              menu={selectedMenu}
              stylist={selectedStylist}
              selectedTime={selectedSlot.time}
              guestInfo={guestInfo}
              onConfirm={handleConfirm}
              onBack={() => setStep(4)}
              isSubmitting={createReservation.isPending}
            />
          )}
        </div>
      </section>
    </>
  )
}
