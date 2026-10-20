'use client'
import { useState } from 'react'
import { useStore, User, dealValue, isWon, isLost, arrOf } from '@/lib/store'
import { toast } from '@/components/Toaster'
import PhotoUpload from '@/components/PhotoUpload'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export default function RepProgress({ user, manager, progress = true }: { user: User; manager: boolean; progress?: boolean }) {
  const { deals, quotes, tasks, invoices, updateUser } = useStore()
  const mine = deals.filter((d) => d.rep === user.name); const open = mine.filter((d) => d.stage < 4); const won = mine.filter(isWon)
  const wonVal = won.reduce((s, d) => s + dealValue(quotes, d.id), 0); const pipe = open.reduce((s, d) => s + dealValue(quotes, d.id), 0)
  const tk = tasks.filter((t) => t.rep === user.name); const inv = invoices.filter((i) => mine.some((d) => d.id === i.dealId))
  const pct = user.target ? Math.min(100, Math.round((wonVal / user.target) * 100)) : 0
  const [f, setF] = useState({ phone: user.phone, city: user.city, target: user.target })
  const stats = [['Deals won', won.length], ['Open deals', open.length], ['Open pipeline', inr(pipe)], ['Conversion', `${Math.round((won.length / Math.max(mine.length, 1)) * 100)}%`],
    ['Tasks done', `${tk.filter((t) => t.done).length}/${tk.length}`], ['Invoiced', inr(inv.reduce((s, i) => s + i.amount, 0))], ['Paid', inr(inv.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0))]]
  return (<>
    {progress && <>
    <div className="box">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm text-mute">Target progress</p><p className="text-3xl font-semibold">{pct}%</p></div><p className="text-sm text-mute">{inr(wonVal)} won of {inr(user.target)} · {inr(Math.max(0, user.target - wonVal))} to go</p></div>
      <div className="mt-3 h-3 rounded-full bg-line"><div className="h-3 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div></div>
    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="box"><p className="text-sm text-mute">{k}</p><p className="mt-1 text-xl font-semibold">{v}</p></div>)}</div>
    </>}
    <div className="box mt-4"><p className="mb-3 font-medium">Details</p>
      <PhotoUpload user={user} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">Name<input className="inp" disabled value={user.name} /></label>
        <label className="grid gap-1 text-sm">Email<input className="inp" disabled value={user.email} /></label>
        <label className="grid gap-1 text-sm">Phone<input className="inp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label className="grid gap-1 text-sm">City<input className="inp" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
        {manager && <label className="grid gap-1 text-sm">Sales target (₹)<input type="number" className="inp" value={f.target} onChange={(e) => setF({ ...f, target: Number(e.target.value) || 0 })} /></label>}</div>
      <button className="btn mt-3" onClick={() => { updateUser(user.id, manager ? f : { phone: f.phone, city: f.city }); toast('Details saved') }}>Save details</button></div>
  </>)
}
