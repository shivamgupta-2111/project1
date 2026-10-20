'use client'
import { useState } from 'react'
import { useStore, Role } from '@/lib/store'
import { toast } from '@/components/Toaster'
export default function QuickTask({ role = 'admin', dealId }: { role?: Role; dealId?: string }) {
  const { deals, addTask } = useStore(); const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name)
  const mine = role === 'rep' ? deals.filter((d) => d.rep === myName) : deals
  const today = new Date().toISOString().slice(0, 10)
  const [t, setT] = useState(''); const [id, setId] = useState(''); const [due, setDue] = useState(today)
  const target = deals.find((d) => d.id === (dealId || id || mine[0]?.id))
  const add = () => { if (!target || !t.trim()) return; addTask({ title: t.trim(), dealId: target.id, due, rep: target.rep }); setT(''); toast('Task added') }
  return (
    <div className={`grid gap-2 ${dealId ? 'md:grid-cols-[1fr_150px_auto]' : 'md:grid-cols-[1fr_160px_140px_auto]'}`}>
      <input className="inp" placeholder="Add a task…" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
      {!dealId && <select className="inp" aria-label="Deal" value={id || mine[0]?.id || ''} onChange={(e) => setId(e.target.value)}>{mine.map((d) => <option key={d.id} value={d.id}>{d.company}</option>)}</select>}
      <input type="date" className="inp" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
      <button className="btn" disabled={!t.trim() || !target} onClick={add}>Add</button>
    </div>)
}
