/** Team list (Admin and CEO) and the form to create a new rep. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import Avatar from '@/components/Avatar'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'
import { dealValue, isLost, isWon } from '@/lib/deals'
import { annualRecurringRevenue } from '@/lib/pricing'
import { formatINR } from '@/lib/format'

export default function Team() {
  const role = useParams().role as Role
  const { users, deals, quotes, addUser } = useStore()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    target: 500000,
  })
  const [err, setErr] = useState('')
  if (role === 'rep')
    return (
      <Shell role={role}>
        <p className="box text-sm text-mute">Team is available to Admin and CEO.</p>
      </Shell>
    )
  const reps = users.filter((user) => user.role === 'rep')
  const ok = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6
  const create = () => {
    const e = addUser({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() })
    if (e) return setErr(e)
    toast('Rep account created')
    setErr('')
    setForm({ name: '', email: '', password: '', phone: '', city: '', target: 500000 })
  }
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="mb-6 text-sm text-mute">
        {reps.length} sales reps. Tap a rep to see their progress.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reps.map((user) => {
          const mine = deals.filter((deal) => deal.rep === user.name)
          const won = mine.filter(isWon).reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
          const pct = user.target ? Math.min(100, Math.round((won / user.target) * 100)) : 0
          return (
            <Link
              key={user.id}
              href={`/${role}/team/${user.id}`}
              className="box transition hover:border-brand hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Avatar name={user.name} photo={user.photo} size={40} />
                <div className="min-w-0">
                  <p className="font-medium">{user.name}</p>
                  <p className="truncate text-xs text-mute">{user.email}</p>
                </div>
              </div>
              <p className="mt-4 flex justify-between text-xs text-mute">
                <span>{mine.length} deals</span>
                <span>
                  {formatINR(won)} / {formatINR(user.target)}
                </span>
              </p>
              <div className="mt-1 h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          )
        })}
      </div>
      <div className="box mt-6">
        <p className="mb-3 font-medium">Create rep account</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="inp"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="inp"
            type="email"
            placeholder="Email (login)"
            value={form.email}
            onChange={(event) => {
              setForm({ ...form, email: event.target.value })
              setErr('')
            }}
          />
          <input
            className="inp"
            type="text"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          <input
            className="inp"
            placeholder="Phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <input
            className="inp"
            placeholder="City"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
          <input
            className="inp"
            type="number"
            placeholder="Sales target (₹)"
            value={form.target}
            onChange={(event) => setForm({ ...form, target: Number(event.target.value) || 0 })}
          />
        </div>
        {err && (
          <p role="alert" className="mt-2 text-sm text-red-500">
            {err}
          </p>
        )}
        <button className="btn mt-3" disabled={!ok} onClick={create}>
          Create account
        </button>
        <p className="mt-2 text-xs text-mute">
          The rep signs in on the login page with this email and password.
        </p>
      </div>
    </Shell>
  )
}
