'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import Avatar from '@/components/Avatar'
import { useStore, Role, dealValue, STAGES } from '@/lib/store'
export default function Clients() {
  const role = useParams().role as Role; const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name); const { deals, quotes, contacts, activity } = useStore(); const [q, setQ] = useState('')
  const mine = role === 'rep' ? deals.filter((d) => d.rep === myName) : deals
  const list = mine.filter((d) => (d.company + d.client).toLowerCase().includes(q.toLowerCase()))
  const last = (id: string) => activity.filter((a) => a.dealId === id).map((a) => a.at).sort().pop()
  return (
    <Shell role={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Clients</h1><p className="text-sm text-mute">{mine.length} companies</p></div>
        <input className="inp max-w-xs" placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')} /></div>
      {list.length === 0 && <p className="box text-sm text-mute">No clients match your search.</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((d) => <Link key={d.id} href={`/${role}/deals/${d.id}`} className="box transition hover:border-brand hover:shadow-md">
        <div className="flex items-center gap-3"><Avatar name={d.company} size={40} />
          <div className="min-w-0"><p className="truncate font-medium">{d.company}</p><p className="text-xs text-mute">{d.client} · Rep {d.rep}</p></div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div><p className="text-base font-semibold">₹{Math.round(dealValue(quotes, d.id)).toLocaleString('en-IN')}</p><p className="text-mute">Value</p></div>
          <div><p className="text-base font-semibold">{contacts.filter((c) => c.dealId === d.id).length}</p><p className="text-mute">Contacts</p></div>
          <div><p className="text-base font-semibold">{STAGES[d.stage]}</p><p className="text-mute">Stage</p></div></div>
        <p className="mt-3 text-xs text-mute">GST {d.gst || '—'} · Last activity {last(d.id) ? new Date(last(d.id)!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p></Link>)}</div>
    </Shell>)
}
