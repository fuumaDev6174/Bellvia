import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

interface PayPayRow {
  transactionId: string
  amount: number
  paidAt: string
  status: string
}

interface ImportResult {
  imported: number
  skipped: number
  duplicates: number
}

export function useImportPayPayCSV() {
  return useMutation({
    mutationFn: async (input: { storeId: string; rows: PayPayRow[] }) =>
      api<ImportResult>('/api/admin/sales/import-paypay', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] })
      toast.success(
        `インポート完了: ${result.imported}件取込 / ${result.duplicates}件重複スキップ / ${result.skipped}件ステータススキップ`
      )
    },
    onError: () => {
      toast.error('インポートに失敗しました')
    },
  })
}
