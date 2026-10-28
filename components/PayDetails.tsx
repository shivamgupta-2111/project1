/** "Pay to" block for invoices and quotations: bank details and the payment QR code from Settings. */
'use client'
import { useStore } from '@/lib/store'

const ROWS: [keyof NonNullable<ReturnType<typeof useStore.getState>['settings']['bank']>, string][] = [
  ['accountName', 'Account name'],
  ['bankName', 'Bank'],
  ['accountNo', 'Account no.'],
  ['ifsc', 'IFSC'],
  ['upi', 'UPI ID'],
]
export default function PayDetails() {
  const settings = useStore((state) => state.settings)
  const bank = settings.bank
  const rows = ROWS.filter(([key]) => bank?.[key]?.trim())
  if (!rows.length && !settings.qr) return null
  return (
    <div className="mt-8 flex flex-wrap items-start justify-between gap-4 border-t border-[#e8e8e6] pt-4 text-sm">
      <div>
        <p className="text-xs text-[#6e6e73]">Pay to</p>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {rows.map(([key, label]) => (
            <div key={key} className="contents">
              <dt className="text-[#6e6e73]">{label}</dt>
              <dd className="font-medium">{bank![key]}</dd>
            </div>
          ))}
        </dl>
      </div>
      {settings.qr && (
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.qr} alt="Payment QR code" className="h-28 w-28 object-contain" />
          <p className="mt-1 text-xs text-[#6e6e73]">Scan to pay</p>
        </div>
      )}
    </div>
  )
}
