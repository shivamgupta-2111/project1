'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { useStore, Role, Task } from '@/lib/store'
export default function Tasks() {
  const role = useParams().role as Role; const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name); const { tasks, deals, addTask, toggleTask, delTask } = useStore()
  const today = new Date().toISOString().slice(0, 10); const mineDeals = role === 'rep' ? deals.filter((d) => d.rep === myName) : deals
  const [f, setF] = useState({ title: '', dealId: '', due: today })
  const mine = role === 'rep' ? tasks.filter((t) => t.rep === myName) : tasks
  const groups: [string, Task[], string][] = [
    ['Overdue', mine.filter((t) => !t.done && t.due < today), 'text-red-500'], ['Today', mine.filter((t) => !t.done && t.due === today), 'text-brand'],
    ['Upcoming', mine.filter((t) => !t.done && t.due > today), 'text-ink'], ['Done', mine.filter((t) => t.done), 'text-mute']]
  const add = () => { const d = deals.find((x) => x.id === (f.dealId || mineDeals[0]?.id)); if (!d) return; addTask({ title: f.title.trim(), dealId: d.id, due: f.due, rep: d.rep }); setF({ ...f, title: '' }); toast('Task added') }
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Tasks and reminders</h1><p className="mb-6 text-sm text-mute">Never miss a follow-up.</p>
      <div className="box grid gap-2 md:grid-cols-[1fr_200px_150px_auto]">
        <input className="inp" placeholder="New task, e.g. Call client" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select className="inp" value={f.dealId} onChange={(e) => setF({ ...f, dealId: e.target.value })}>{mineDeals.map((d) => <option key={d.id} value={d.id}>{d.company}</option>)}</select>
        <input type="date" className="inp" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
        <button className="btn" disabled={!f.title.trim()} onClick={add}>Add task</button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">{groups.map(([name, list, c]) => <div key={name} className="box">
        <p className={`mb-3 font-medium ${c}`}>{name} <span className="text-sm font-normal text-mute">({list.length})</span></p>
        {list.length === 0 ? <p className="text-sm text-mute">Nothing here.</p> : <ul className="grid gap-2">{list.map((t) => <li key={t.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#e87722]" checked={t.done} onChange={() => toggleTask(t.id)} aria-label="Mark done" />
          <span className="min-w-0 flex-1"><span className={t.done ? 'line-through text-mute' : ''}>{t.title}</span><Link href={`/${role}/deals/${t.dealId}`} className="block text-xs text-mute hover:text-brand">{deals.find((d) => d.id === t.dealId)?.company} · {t.due}</Link></span>
          <button aria-label="Delete" onClick={() => delTask(t.id)}><Trash2 size={16} className="text-mute" /></button></li>)}</ul>}</div>)}</div>
    </Shell>)
}
