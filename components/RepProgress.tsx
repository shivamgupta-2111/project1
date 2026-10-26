/** Target progress, stats and editable details for a rep. */
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { toast } from '@/components/Toaster'
import PhotoUpload from '@/components/PhotoUpload'
import { User } from '@/lib/types'
import { dealValue, isLost, isWon } from '@/lib/deals'
import { annualRecurringRevenue } from '@/lib/pricing'
import { formatINR } from '@/lib/format'

export default function RepProgress({
  user,
  manager,
  progress = true,
  details = true,
}: {
  user: User
  manager: boolean
  progress?: boolean
  details?: boolean
}) {
  const { deals, quotes, tasks, invoices, updateUser } = useStore()
  const mine = deals.filter((deal) => deal.rep === user.name)
  const open = mine.filter((deal) => deal.stage < 4)
  const won = mine.filter(isWon)
  const wonVal = won.reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
  const pipe = open.reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
  const tk = tasks.filter((task) => task.rep === user.name)
  const inv = invoices.filter((invoice) => mine.some((deal) => deal.id === invoice.dealId))
  const pct = user.target ? Math.min(100, Math.round((wonVal / user.target) * 100)) : 0
  const [form, setForm] = useState({ phone: user.phone, city: user.city, target: user.target })
  const stats = [
    ['Deals won', won.length],
    ['Open deals', open.length],
    ['Open pipeline', formatINR(pipe)],
    ['Conversion', `${Math.round((won.length / Math.max(mine.length, 1)) * 100)}%`],
    ['Tasks done', `${tk.filter((task) => task.done).length}/${tk.length}`],
    ['Invoiced', formatINR(inv.reduce((sum, invoice) => sum + invoice.amount, 0))],
    [
      'Paid',
      formatINR(
        inv
          .filter((invoice) => invoice.status === 'Paid')
          .reduce((sum, invoice) => sum + invoice.amount, 0),
      ),
    ],
  ]
  return (
    <>
      {progress && (
        <>
          <div className="box">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm text-mute">Target progress</p>
                <p className="text-3xl font-semibold">{pct}%</p>
              </div>
              <p className="text-sm text-mute">
                {formatINR(wonVal)} won of {formatINR(user.target)} ·{' '}
                {formatINR(Math.max(0, user.target - wonVal))} to go
              </p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-line">
              <div
                className="h-3 rounded-full bg-brand transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(([k, v]) => (
              <div key={k} className="box">
                <p className="text-sm text-mute">{k}</p>
                <p className="mt-1 text-xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {details && (
        <div className="box mt-4">
          <p className="mb-3 font-medium">Details</p>
          <PhotoUpload user={user} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Name
              <input className="inp" disabled value={user.name} />
            </label>
            <label className="grid gap-1 text-sm">
              Email
              <input className="inp" disabled value={user.email} />
            </label>
            <label className="grid gap-1 text-sm">
              Phone
              <input
                className="inp"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              City
              <input
                className="inp"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </label>
            {manager && (
              <label className="grid gap-1 text-sm">
                Sales target (₹)
                <input
                  type="number"
                  className="inp"
                  value={form.target}
                  onChange={(event) =>
                    setForm({ ...form, target: Number(event.target.value) || 0 })
                  }
                />
              </label>
            )}
          </div>
          <button
            className="btn mt-3"
            onClick={() => {
              updateUser(user.id, manager ? form : { phone: form.phone, city: form.city })
              toast('Details saved')
            }}
          >
            Save details
          </button>
        </div>
      )}
    </>
  )
}
