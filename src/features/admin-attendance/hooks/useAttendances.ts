import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useStoreContext } from '@/hooks/useStoreContext'
import type { Attendance } from '@/types/models'

export interface AttendanceWithStaff extends Attendance {
  staff?: { display_name: string }
  corrector?: { display_name: string } | null
}

export function useMyAttendanceStatus() {
  return useQuery<Attendance | null>({
    queryKey: ['my-attendance-status'],
    queryFn: () => api<Attendance | null>('/api/admin/attendances/my-status'),
  })
}

export function useClockIn() {
  return useMutation({
    mutationFn: async (note?: string) =>
      api<Attendance>('/api/admin/attendances/clock-in', {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-status'] })
      toast.success('出勤しました')
    },
    onError: () => {
      toast.error('出勤打刻に失敗しました')
    },
  })
}

export function useClockOut() {
  return useMutation({
    mutationFn: async (note?: string) =>
      api<Attendance>('/api/admin/attendances/clock-out', {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-status'] })
      queryClient.invalidateQueries({ queryKey: ['admin-attendances'] })
      toast.success('退勤しました')
    },
    onError: () => {
      toast.error('退勤打刻に失敗しました')
    },
  })
}

export function useAttendances(startDate: string, endDate: string, staffId?: string) {
  const { activeStoreId } = useStoreContext()

  return useQuery<AttendanceWithStaff[]>({
    queryKey: ['admin-attendances', activeStoreId, startDate, endDate, staffId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (activeStoreId) params.set('storeId', activeStoreId)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (staffId) params.set('staffId', staffId)
      return api<AttendanceWithStaff[]>(`/api/admin/attendances?${params}`)
    },
    enabled: !!activeStoreId,
  })
}

export function useCorrectAttendance() {
  return useMutation({
    mutationFn: async (input: {
      id: string
      clockIn?: string
      clockOut?: string
      clockInNote?: string
      clockOutNote?: string
      correctionReason: string
    }) => {
      const { id, ...body } = input
      return api<Attendance>(`/api/admin/attendances/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendances'] })
      toast.success('勤怠記録を修正しました')
    },
    onError: () => {
      toast.error('修正に失敗しました')
    },
  })
}
