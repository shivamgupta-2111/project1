'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import Avatar from '@/components/Avatar'
import { useStore, Role, dealValue, isWon, isLost, arrOf } from '@/lib/store'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export default function Team() {
  const role = useParams().role as Role; const { users, deals, quotes, addUser } = useStore()
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', city: '', target: 500000 }); const [err, setErr] = useState('')
  if (role === 'rep') return <Shell role={role}><p className="box text-sm text-mute">Team is available to Admin and CEO.</p></Shell>
  const reps = users.filter((u) => u.role === 'rep'); const ok = f.name.trim() && /\S+@\S+\.\S+/.test(f.email) && f.password.length >= 6
  const create = () => { const e = addUser({ ...f, name: f.name.trim(), email: f.email.trim().toLowerCase() }); if (e) return setErr(e); toast('Rep account created'); setErr(''); setF({ name: '', email: '', password: '', phone: '', city: '', target: 500000 }) }
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Team</h1><p className="mb-6 text-sm text-mute">{reps.length} sales reps. Tap a rep to see their progress.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reps.map((u) => { const mine = deals.filter((d) => d.rep === u.name); const won = mine.filter(isWon).reduce((s, d) => s + dealValue(quotes, d.id), 0); const pct = u.target ? Math.min(100, Math.round((won / u.target) * 100)) : 0
        return <Link key={u.id} href={`/${role}/team/${u.id}`} className="box transition hover:border-brand hover:shadow-md">
          <div className="flex items-center gap-3"><Avatar name={u.name} photo={u.photo} size={40} /><div className="min-w-0"><p className="font-medium">{u.name}</p><p className="truncate text-xs text-mute">{u.email}</p></div></div>
          <p className="mt-4 flex justify-between text-xs text-mute"><span>{mine.length} deals</span><span>{inr(won)} / {inr(u.target)}</span></p>
          <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} /></div></Link> })}</div>
      <div className="box mt-6"><p className="mb-3 font-medium">Create rep account</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="inp" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="inp" type="email" placeholder="Email (login)" value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setErr('') }} />
          <input className="inp" type="text" placeholder="Password (min 6 characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <input className="inp" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className="inp" placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <input className="inp" type="number" placeholder="Sales target (₹)" value={f.target} onChange={(e) => setF({ ...f, target: Number(e.target.value) || 0 })} /></div>
        {err && <p role="alert" className="mt-2 text-sm text-red-500">{err}</p>}
        <button className="btn mt-3" disabled={!ok} onClick={create}>Create account</button>
        <p className="mt-2 text-xs text-mute">The rep signs in on the login page with this email and password.</p></div>
    </Shell>)
}
