'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import Avatar from '@/components/Avatar'
import RepLink from '@/components/RepLink'
import { useStore, Role, Deal, dealValue } from '@/lib/store'
const RISK = { Low: 'bg-green-500/15 text-green-600', Medium: 'bg-amber-500/15 text-amber-600', High: 'bg-red-500/15 text-red-500' }
// Same 6 columns as the Pipeline page: Done and Cancelled are split out of "Closed"
const COLS = ['Discover', 'Identify', 'Next', 'Proposal', 'Closed · Done', 'Cancelled']
const colOf = (d: Deal) => (d.stage < 4 ? d.stage : d.outcome === 'Cancelled' ? 5 : 4)
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export default function Stages() {
  const role = useParams().role as Role
  const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name)
  const { deals, quotes, users } = useStore()
  const [sel, setSel] = useState(0); const [rep, setRep] = useState('All'); const [q, setQ] = useState('')
  const adm = role !== 'rep'
  const reps = users.filter((u) => u.role === 'rep').map((u) => u.name)
  const base = deals.filter((d) => (adm ? rep === 'All' || d.rep === rep : d.rep === myName))
  const count = (i: number) => base.filter((d) => colOf(d) === i).length
  const list = base.filter((d) => colOf(d) === sel && (d.company + d.client).toLowerCase().includes(q.toLowerCase()))
  const total = list.reduce((s, d) => s + dealValue(quotes, d.id), 0)
  const tone = (i: number) => (i === 4 ? 'text-green-600' : i === 5 ? 'text-red-500' : 'text-brand')
  return (
    <Shell role={role}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Stages</h1><p className="text-sm text-mute">Tap a stage to see which clients are in it.</p></div>
        {adm && <select aria-label="Filter by rep" className="inp !w-auto" value={rep} onChange={(e) => setRep(e.target.value)}><option>All</option>{reps.map((r) => <option key={r}>{r}</option>)}</select>}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {COLS.map((c, i) => <button key={c} onClick={() => setSel(i)} className={`box !p-4 text-left transition ${sel === i ? 'border-brand ring-2 ring-brand/40' : ''}`}>
          <p className={`text-xs font-medium ${tone(i)}`}>{c}</p><p className="mt-1 text-2xl font-semibold">{count(i)}</p><p className="text-[11px] text-mute">client{count(i) === 1 ? '' : 's'}</p></button>)}
      </div>
      <div className="box">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-medium">{COLS[sel]}</h2><p className="text-xs text-mute">{list.length} client{list.length === 1 ? '' : 's'} · {inr(total)}</p></div>
          <input className="inp !w-full md:!w-64" placeholder="Search client or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {list.length === 0 ? <p className="py-8 text-center text-sm text-mute">No clients in this stage.</p> :
          <ul className="grid gap-2">{list.map((d) => <li key={d.id} className="relative">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand">
              <Avatar name={d.company} size={38} />
              <div className="min-w-0 flex-1"><p className="truncate font-medium"><Link href={`/${role}/deals/${d.id}`} className="after:absolute after:inset-0">{d.company}</Link></p><p className="text-xs text-mute">{d.client}{adm && <> · Rep: <RepLink name={d.rep} /></>}</p></div>
              <span className={`pill ${RISK[d.risk]}`}>{d.risk} risk</span>
              <div className="text-right"><p className="text-sm font-semibold">{inr(dealValue(quotes, d.id))}</p><p className="text-[11px] text-mute">{sel >= 4 ? `Closed ${d.closedAt ?? ''}` : `Target ${d.target}`}</p></div>
            </div></li>)}</ul>}
      </div>
    </Shell>)
}
