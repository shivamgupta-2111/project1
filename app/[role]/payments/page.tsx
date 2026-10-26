/** Payment schedule across all deals, with due dates and paid status. */
'use client'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'
import { formatINR } from '@/lib/format'

const iso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const TABS = ['All', 'Overdue', 'Due soon', 'Upcoming', 'Paid'] as const
export default function Payments() {
  const role = useParams().role as Role
  const { payments, deals, contacts, settings, markPaymentPaid } = useStore()
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const today = iso(0)
  const soon = iso(settings.remindDays ?? 7)
  const mine = payments.filter(
    (payment) => role !== 'rep' || deals.find((deal) => deal.id === payment.dealId)?.rep === myName,
  )
  const st = (payment: (typeof payments)[number]) =>
    payment.status === 'Paid'
      ? 'Paid'
      : payment.due < today
        ? 'Overdue'
        : payment.due <= soon
          ? 'Due soon'
          : 'Upcoming'
  const list = mine
    .filter((payment) => tab === 'All' || st(payment) === tab)
    .sort((a, payment) =>
      a.status === payment.status ? a.due.localeCompare(payment.due) : a.status === 'Due' ? -1 : 1,
    )
  const sum = (k: string) =>
    mine.filter((payment) => st(payment) === k).reduce((sum, payment) => sum + payment.amount, 0)
  const cnt = (k: string) => mine.filter((payment) => st(payment) === k).length
  const cls: Record<string, string> = {
    Paid: 'bg-green-500/15 text-green-600',
    Overdue: 'bg-red-500/15 text-red-500',
    'Due soon': 'bg-brand/15 text-brand',
    Upcoming: 'bg-line text-mute',
  }
  const msg = (payment: (typeof payments)[number]) => {
    const d = deals.find((deal) => deal.id === payment.dealId)
    return `Hello, this is a reminder that your ${payment.kind.toLowerCase()} payment ${payment.n} of ${payment.of} (${formatINR(payment.amount)}) for ${d?.company} is due on ${payment.due}. Thank you.`
  }
  const phone = (s: string) => {
    const n = s.replace(/\D/g, '')
    return n.length === 10 ? '91' + n : n
  }
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Payments and renewals</h1>
      <p className="mb-6 text-sm text-mute">
        Monthly subscriptions bill every month. Annual (ARR) subscriptions bill once a year.
        Reminders start {settings.remindDays ?? 7} days before the due date.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Overdue', 'text-red-500'],
          ['Due soon', 'text-brand'],
          ['Upcoming', ''],
          ['Paid', 'text-green-600'],
        ].map(([k, c]) => (
          <div key={k} className="box">
            <p className="text-sm text-mute">{k}</p>
            <p className={`mt-1 text-xl font-semibold ${c}`}>{formatINR(sum(k))}</p>
            <p className="text-xs text-mute">
              {cnt(k)} payment{cnt(k) === 1 ? '' : 's'}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${tab === t ? 'bg-brand text-white' : 'border border-line text-mute'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="box mt-3">
        <div className="overflow-x-auto scroll-y">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-mute">
              <tr>
                <th className="pb-2 font-medium">Company</th>
                <th className="font-medium">Plan</th>
                <th className="font-medium">Due date</th>
                <th className="font-medium">Amount</th>
                <th className="font-medium">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((payment) => {
                const d = deals.find((deal) => deal.id === payment.dealId)
                const c = contacts.find((contact) => contact.dealId === payment.dealId)
                const s = st(payment)
                return (
                  <tr key={payment.id} className="border-t border-line">
                    <td className="py-3 font-medium">{d?.company}</td>
                    <td>
                      {payment.kind} · {payment.n} of {payment.of}
                    </td>
                    <td className={s === 'Overdue' ? 'text-red-500' : ''}>{payment.due}</td>
                    <td>{formatINR(payment.amount)}</td>
                    <td>
                      <span className={`pill ${cls[s]}`}>{s}</span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {payment.status === 'Due' && (
                          <>
                            {c?.email ? (
                              <a
                                className="btn2 py-1 text-xs"
                                href={`mailto:${c.email}?subject=${encodeURIComponent('Payment reminder')}&body=${encodeURIComponent(msg(payment))}`}
                              >
                                Email
                              </a>
                            ) : (
                              <button
                                className="btn2 py-1 text-xs"
                                onClick={() =>
                                  toast('Add a contact with an email on the deal first')
                                }
                              >
                                Email
                              </button>
                            )}
                            {c?.phone ? (
                              <a
                                className="btn2 py-1 text-xs"
                                target="_blank"
                                rel="noreferrer"
                                href={`https://wa.me/${phone(c.phone)}?text=${encodeURIComponent(msg(payment))}`}
                              >
                                WhatsApp
                              </a>
                            ) : (
                              <button
                                className="btn2 py-1 text-xs"
                                onClick={() =>
                                  toast('Add a contact with a phone on the deal first')
                                }
                              >
                                WhatsApp
                              </button>
                            )}
                          </>
                        )}
                        {role === 'admin' && (
                          <button
                            className="btn2 py-1 text-xs"
                            onClick={() => {
                              markPaymentPaid(payment.id, payment.status !== 'Paid')
                              toast(
                                payment.status === 'Paid' ? 'Marked unpaid' : 'Payment recorded',
                              )
                            }}
                          >
                            {payment.status === 'Paid' ? 'Undo' : 'Mark paid'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-mute">
              No payments here. They are created when a quote with a Monthly or Annual product is
              marked Final.
            </p>
          )}
        </div>
      </div>
    </Shell>
  )
}
