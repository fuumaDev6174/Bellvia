import { useState, useRef, type ChangeEvent } from 'react'
import { Modal, Button } from '@/components/ui'
import { useStoreContext } from '@/hooks/useStoreContext'
import { useImportPayPayCSV } from '../hooks/useSales'
import { formatPrice } from '@/lib/utils'

interface ParsedRow {
  transactionId: string
  amount: number
  paidAt: string
  status: string
  willImport: boolean
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'))

  // Find column indices by header name
  const dateIdx = headers.findIndex((h) => h.includes('決済日時') || h.includes('日時') || h.includes('Date'))
  const txnIdx = headers.findIndex((h) => h.includes('決済番号') || h.includes('取引番号') || h.includes('Transaction'))
  const amountIdx = headers.findIndex((h) => h.includes('決済金額') || h.includes('金額') || h.includes('Amount'))
  const statusIdx = headers.findIndex((h) => h.includes('ステータス') || h.includes('Status') || h.includes('決済ステータス'))

  if (amountIdx === -1) return []

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length <= amountIdx) continue

    const amount = parseInt(cols[amountIdx].replace(/[,"¥\\]/g, ''), 10)
    if (isNaN(amount) || amount <= 0) continue

    const status = statusIdx >= 0 ? cols[statusIdx].trim() : '完了'
    const willImport = status === '完了' || status === 'completed' || status === 'SUCCESS'

    rows.push({
      transactionId: txnIdx >= 0 ? cols[txnIdx].trim() : `paypay-${i}-${Date.now()}`,
      amount,
      paidAt: dateIdx >= 0 ? parseDate(cols[dateIdx].trim()) : new Date().toISOString(),
      status,
      willImport,
    })
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string): string {
  // Handle common JP date formats: 2024/01/15 10:30:00, 2024-01-15T10:30:00
  const cleaned = dateStr.replace(/\//g, '-').replace(/^"(.*)"$/, '$1')
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

interface PayPayImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PayPayImportModal({ isOpen, onClose }: PayPayImportModalProps) {
  const { activeStoreId } = useStoreContext()
  const importMutation = useImportPayPayCSV()
  const fileRef = useRef<HTMLInputElement>(null)

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setParseError('')
    setParsedRows([])

    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer

      // Try Shift-JIS first, then UTF-8
      let text: string
      try {
        const decoder = new TextDecoder('shift-jis')
        text = decoder.decode(buffer)
        // If it looks garbled (no Japanese chars found where expected), try UTF-8
        if (!text.includes('決済') && !text.includes('金額') && !text.includes('ステータス')) {
          const utf8Decoder = new TextDecoder('utf-8')
          text = utf8Decoder.decode(buffer)
        }
      } catch {
        const utf8Decoder = new TextDecoder('utf-8')
        text = utf8Decoder.decode(buffer)
      }

      const rows = parseCSV(text)
      if (rows.length === 0) {
        setParseError('CSVの解析に失敗しました。PayPayの決済履歴CSVであることを確認してください。')
        return
      }
      setParsedRows(rows)
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    if (!activeStoreId || parsedRows.length === 0) return

    const importableRows = parsedRows.filter((r) => r.willImport)
    await importMutation.mutateAsync({
      storeId: activeStoreId,
      rows: importableRows,
    })
    handleClose()
  }

  function handleClose() {
    setParsedRows([])
    setFileName('')
    setParseError('')
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  const importableCount = parsedRows.filter((r) => r.willImport).length
  const skipCount = parsedRows.length - importableCount
  const totalAmount = parsedRows.filter((r) => r.willImport).reduce((sum, r) => sum + r.amount, 0)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="PayPay売上インポート" size="lg">
      <div className="space-y-4">
        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CSVファイルを選択</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
          {fileName && <p className="mt-1 text-xs text-gray-500">{fileName}</p>}
        </div>

        {parseError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{parseError}</div>
        )}

        {/* Preview */}
        {parsedRows.length > 0 && (
          <>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-600">
                取込対象: <span className="font-semibold text-primary-700">{importableCount}件</span>
              </span>
              {skipCount > 0 && (
                <span className="text-gray-400">スキップ: {skipCount}件（未完了ステータス）</span>
              )}
              <span className="text-gray-600">
                合計金額: <span className="font-semibold">{formatPrice(totalAmount)}</span>
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-3 py-2 font-medium text-gray-500">日時</th>
                    <th className="px-3 py-2 font-medium text-gray-500">決済番号</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">金額</th>
                    <th className="px-3 py-2 font-medium text-gray-500">ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={row.willImport ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-50'}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                        {new Date(row.paidAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{row.transactionId}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatPrice(row.amount)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.willImport
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleImport}
            disabled={importableCount === 0}
            loading={importMutation.isPending}
          >
            {importableCount}件をインポート
          </Button>
        </div>
      </div>
    </Modal>
  )
}
