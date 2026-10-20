'use client'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { useStore, Role } from '@/lib/store'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const iso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const TABS = ['All', 'Overdue', 'Due soon', 'Upcoming', 'Paid'] as const
export default function Payments() {
  const role = useParams().role as Role; const { payments, deals, contacts, settings, markPaid } = useStore(); const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name)
  const [tab, setTab] = useState<(typeof TABS)[number]>('All'); const today = iso(0); const soon = iso(settings.remindDays ?? 7)
  const mine = payments.filter((p) => role !== 'rep' || deals.find((d) => d.id === p.dealId)?.rep === myName)
  const st = (p: (typeof payments)[number]) => (p.status === 'Paid' ? 'Paid' : p.due < today ? 'Overdue' : p.due <= soon ? 'Due soon' : 'Upcoming')
  const list = mine.filter((p) => tab === 'All' || st(p) === tab).sort((a, b) => (a.status === b.status ? a.due.localeCompare(b.due) : a.status === 'Due' ? -1 : 1))
  const sum = (k: string) => mine.filter((p) => st(p) === k).reduce((s, p) => s + p.amount, 0); const cnt = (k: string) => mine.filter((p) => st(p) === k).length
  const cls: Record<string, string> = { Paid: 'bg-green-500/15 text-green-600', Overdue: 'bg-red-500/15 text-red-500', 'Due soon': 'bg-brand/15 text-brand', Upcoming: 'bg-line text-mute' }
  const msg = (p: (typeof payments)[number]) => { const d = deals.find((x) => x.id === p.dealId); return `Hello, this is a reminder that your ${p.kind.toLowerCase()} payment ${p.n} of ${p.of} (${inr(p.amount)}) for ${d?.company} is due on ${p.due}. Thank you.` }
  const phone = (s: string) => { const n = s.replace(/\D/g, ''); return n.length === 10 ? '91' + n : n }
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Payments and renewals</h1><p className="mb-6 text-sm text-mute">Monthly subscriptions bill every month. Annual (ARR) subscriptions bill once a year. Reminders start {settings.remindDays ?? 7} days before the due date.</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[['Overdue', 'text-red-500'], ['Due soon', 'text-brand'], ['Upcoming', ''], ['Paid', 'text-green-600']].map(([k, c]) => <div key={k} className="box"><p className="text-sm text-mute">{k}</p><p className={`mt-1 text-xl font-semibold ${c}`}>{inr(sum(k))}</p><p className="text-xs text-mute">{cnt(k)} payment{cnt(k) === 1 ? '' : 's'}</p></div>)}</div>
      <div className="mt-4 flex gap-1 overflow-x-auto">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${tab === t ? 'bg-brand text-white' : 'border border-line text-mute'}`}>{t}</button>)}</div>
      <div className="box mt-3"><div className="overflow-x-auto scroll-y"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs text-mute"><tr><th className="pb-2 font-medium">Company</th><th className="font-medium">Plan</th><th className="font-medium">Due date</th><th className="font-medium">Amount</th><th className="font-medium">Status</th><th /></tr></thead>
        <tbody>{list.map((p) => { const d = deals.find((x) => x.id === p.dealId); const c = contacts.find((x) => x.dealId === p.dealId); const s = st(p)
          return <tr key={p.id} className="border-t border-line"><td className="py-3 font-medium">{d?.company}</td><td>{p.kind} · {p.n} of {p.of}</td><td className={s === 'Overdue' ? 'text-red-500' : ''}>{p.due}</td><td>{inr(p.amount)}</td><td><span className={`pill ${cls[s]}`}>{s}</span></td>
            <td><div className="flex justify-end gap-2">{p.status === 'Due' && <>
              {c?.email ? <a className="btn2 py-1 text-xs" href={`mailto:${c.email}?subject=${encodeURIComponent('Payment reminder')}&body=${encodeURIComponent(msg(p))}`}>Email</a> : <button className="btn2 py-1 text-xs" onClick={() => toast('Add a contact with an email on the deal first')}>Email</button>}
              {c?.phone ? <a className="btn2 py-1 text-xs" target="_blank" rel="noreferrer" href={`https://wa.me/${phone(c.phone)}?text=${encodeURIComponent(msg(p))}`}>WhatsApp</a> : <button className="btn2 py-1 text-xs" onClick={() => toast('Add a contact with a phone on the deal first')}>WhatsApp</button>}</>}
              {role === 'admin' && <button className="btn2 py-1 text-xs" onClick={() => { markPaid(p.id, p.status !== 'Paid'); toast(p.status === 'Paid' ? 'Marked unpaid' : 'Payment recorded') }}>{p.status === 'Paid' ? 'Undo' : 'Mark paid'}</button>}</div></td></tr> })}</tbody></table>
        {list.length === 0 && <p className="py-6 text-center text-sm text-mute">No payments here. They are created when a quote with a Monthly or Annual product is marked Final.</p>}</div></div>
    </Shell>)
}
