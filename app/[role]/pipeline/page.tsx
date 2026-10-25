'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import NewDeal from '@/components/NewDeal'
import RepLink from '@/components/RepLink'
import { stageTo } from '@/components/CloseDialog'
import { useStore, Role, Deal, dealValue } from '@/lib/store'
const COLS = [
  { name: 'Discover', stage: 0 }, { name: 'Identify', stage: 1 }, { name: 'Next', stage: 2 }, { name: 'Proposal', stage: 3 },
  { name: 'Closed · Done', stage: 4, out: 'Won' as const }, { name: 'Cancelled', stage: 4, out: 'Cancelled' as const }]
const colOf = (d: Deal) => (d.stage < 4 ? d.stage : d.outcome === 'Cancelled' ? 5 : 4)
export default function Pipeline() {
  const role = useParams().role as Role; const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name); const { deals, quotes } = useStore()
  const [drag, setDrag] = useState<string | null>(null); const [over, setOver] = useState<number | null>(null)
  const mine = role === 'rep' ? deals.filter((d) => d.rep === myName) : deals
  return (
    <Shell role={role}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Pipeline</h1><p className="text-sm text-mute">Drag cards between tiles, or use the menu on a card. Closed and Cancelled ask for a note.</p></div><NewDeal role={role} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{COLS.map((c, i) => { const col = mine.filter((d) => colOf(d) === i); const tone = i === 4 ? 'border-green-600/50' : i === 5 ? 'border-red-500/50' : 'border-line'
        return <div key={c.name} onDragOver={(e) => { e.preventDefault(); setOver(i) }} onDragLeave={() => setOver(null)} onDrop={() => { if (drag) stageTo(drag, c.stage, c.out); setDrag(null); setOver(null) }}
          className={`scroll-y min-h-[220px] max-h-[60vh] overflow-y-auto rounded-xl border p-3 ${over === i ? 'border-brand bg-brand/5' : `${tone} glass-soft`}`}>
          <p className="mb-3 flex justify-between text-sm font-medium"><span className={i === 4 ? 'text-green-600' : i === 5 ? 'text-red-500' : ''}>{c.name}</span><span className="pill bg-brand/10 text-brand">{col.length}</span></p>
          <div className="grid gap-3">{col.length === 0 && <p className="py-6 text-center text-xs text-mute">Drop a deal here</p>}{col.map((d) => {
            return <div key={d.id} draggable onDragStart={() => setDrag(d.id)} onDragEnd={() => { setDrag(null); setOver(null) }} className={`box cursor-grab p-3 active:cursor-grabbing ${i >= 4 ? `border-l-4 ${i === 5 ? 'border-l-red-500' : 'border-l-green-600'}` : ''}`}>
              <Link href={`/${role}/deals/${d.id}`} className="font-medium hover:text-brand">{d.company}</Link>
              <p className="text-xs text-mute">{d.client} · {d.risk} risk{role !== 'rep' && <> · <RepLink name={d.rep} /></>}</p>
              <p className="mt-1 text-sm font-semibold">₹{Math.round(dealValue(quotes, d.id)).toLocaleString('en-IN')}</p>
              {i >= 4 && d.closeNote && <p className="mt-1 text-xs text-mute">{d.closeNote}</p>}
              <select aria-label="Move to" className="inp mt-2 py-1 text-xs" value={colOf(d)} onChange={(e) => { const n = Number(e.target.value); stageTo(d.id, COLS[n].stage, COLS[n].out) }}>{COLS.map((x, n) => <option key={x.name} value={n}>{x.name}</option>)}</select></div> })}</div>
        </div> })}</div>
    </Shell>)
}
