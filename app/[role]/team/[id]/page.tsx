'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Phone, Mail, MapPin, Target, AlertTriangle } from 'lucide-react'
import Shell from '@/components/Shell'
import RepProgress from '@/components/RepProgress'
import Avatar from '@/components/Avatar'
import { dueLabel } from '@/components/FollowUp'
import { useStore, Role, Deal, STAGES, dealValue, isWon, isLost } from '@/lib/store'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const RISK = { Low: 'bg-green-500/15 text-green-600', Medium: 'bg-amber-500/15 text-amber-600', High: 'bg-red-500/15 text-red-500' }
const COLS = ['Discover', 'Identify', 'Next', 'Proposal', 'Closed · Done', 'Cancelled']
const colOf = (d: Deal) => (d.stage < 4 ? d.stage : d.outcome === 'Cancelled' ? 5 : 4)
const fmt = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const TABS = ['Overview', 'Deals', 'Calls & meetings', 'Tasks', 'Activity', 'Profile'] as const
export default function RepDetail() {
  const { role: r, id } = useParams() as { role: Role; id: string }
  const { users, deals, quotes, tasks, records, activity, payments } = useStore(); const u = users.find((x) => x.id === id && x.role === 'rep')
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  if (r === 'rep') return <Shell role={r}><p className="box text-sm text-mute">Not available.</p></Shell>
  if (!u) return <Shell role={r}><Link href={`/${r}/team`} className="text-sm text-mute hover:text-brand">← Team</Link><p className="box mt-3 text-sm text-mute">Rep not found.</p></Shell>
  const iso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); const today = iso(0)
  const mine = deals.filter((d) => d.rep === u.name); const open = mine.filter((d) => d.stage < 4); const val = (d: Deal) => dealValue(quotes, d.id); const co = (id: string) => deals.find((d) => d.id === id)?.company || '—'
  const tk = tasks.filter((t) => t.rep === u.name); const rec = records.filter((x) => x.by === u.name).sort((a, b) => b.at.localeCompare(a.at))
  const act = activity.filter((a) => a.by === u.name).sort((a, b) => b.at.localeCompare(a.at))
  const lastRec = (id: string) => records.filter((x) => x.dealId === id && x.type !== 'Note').sort((a, b) => b.at.localeCompare(a.at))[0]?.at
  const overdue = tk.filter((t) => !t.done && t.due < today); const pastTarget = open.filter((d) => d.target < today)
  const pendingQ = quotes.filter((q) => q.status === 'Pending approval' && mine.some((d) => d.id === q.dealId))
  const payLate = payments.filter((p) => p.status === 'Due' && p.due < today && mine.some((d) => d.id === p.dealId))
  const quiet = open.filter((d) => { const l = lastRec(d.id); return !l || l < new Date(Date.now() - 14 * 864e5).toISOString() })
  const m30 = rec.filter((x) => x.at >= new Date(Date.now() - 30 * 864e5).toISOString()); const calls = m30.filter((x) => x.type === 'Call'); const meets = m30.filter((x) => x.type === 'Meeting')
  const flags: [string, number, string][] = [['Overdue tasks', overdue.length, 'tasks'], ['Open deals past target date', pastTarget.length, 'deals'], ['Quotes waiting for approval', pendingQ.length, 'deals'], ['Overdue payments', payLate.length, 'deals'], ['Open deals with no contact in 14 days', quiet.length, 'deals']]
  const dealRow = (d: Deal) => <tr key={d.id} className="border-t border-line"><td className="py-2.5 pr-3"><Link href={`/${r}/deals/${d.id}`} className="font-medium hover:text-brand">{d.company}</Link><p className="text-xs text-mute">{d.client}</p></td>
    <td className="pr-3"><span className={`pill ${d.stage === 4 ? (d.outcome === 'Cancelled' ? 'bg-red-500/15 text-red-500' : 'bg-green-500/15 text-green-600') : 'bg-brand/10 text-brand'}`}>{d.stage === 4 ? (d.outcome === 'Cancelled' ? 'Cancelled' : 'Won') : STAGES[d.stage]}</span></td>
    <td className="pr-3">{inr(val(d))}</td><td className="pr-3"><span className={`pill ${RISK[d.risk]}`}>{d.risk}</span></td><td className="pr-3 text-mute">{d.target}</td><td className="text-mute">{d.lostReason ?? (d.stage < 4 && lastRec(d.id) ? `Contact ${Math.floor((Date.now() - new Date(lastRec(d.id)!).getTime()) / 864e5)}d ago` : '')}</td></tr>
  return (
    <Shell role={r}>
      <Link href={`/${r}/team`} className="text-sm text-mute hover:text-brand">← Team</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><Avatar name={u.name} photo={u.photo} size={56} />
          <div><h1 className="text-2xl font-semibold">{u.name}</h1><p className="text-sm text-mute">Sales rep{u.city && ` · ${u.city}`}</p></div></div>
        <div className="flex flex-wrap gap-2 text-sm">
          {u.phone && <a className="btn2 flex items-center gap-2" href={`tel:${u.phone}`}><Phone size={15} />{u.phone}</a>}
          <a className="btn2 flex items-center gap-2" href={`mailto:${u.email}`}><Mail size={15} />{u.email}</a>
          {u.city && <span className="btn2 flex items-center gap-2 !cursor-default hover:!bg-transparent"><MapPin size={15} />{u.city}</span>}
          <span className="btn2 flex items-center gap-2 !cursor-default hover:!bg-transparent"><Target size={15} />Target {inr(u.target)}</span></div></div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-brand text-brand' : 'border-transparent text-mute'}`}>{t}</button>)}</div>

      {tab === 'Overview' && <>
        <RepProgress key={u.id} user={u} manager details={false} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="box"><p className="mb-3 font-medium">Needs attention</p>
            <ul className="grid gap-2 text-sm">{flags.map(([l, n]) => <li key={l} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2">{n > 0 && <AlertTriangle size={14} className="text-amber-600" />}{l}</span><span className={`pill ${n > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-green-500/15 text-green-600'}`}>{n}</span></li>)}</ul></div>
          <div className="box"><p className="mb-3 font-medium">Deals by stage</p>
            <div className="grid gap-3">{COLS.map((c, i) => { const n = mine.filter((d) => colOf(d) === i).length; return <div key={c}><div className="flex justify-between text-sm"><span>{c}</span><span className="text-mute">{n}</span></div><div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${(n / Math.max(1, mine.length)) * 100}%` }} /></div></div> })}</div></div>
          <div className="box"><p className="mb-3 font-medium">Last 30 days</p>
            <div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-2xl font-semibold">{calls.length}</p><p className="text-xs text-mute">Calls</p></div><div><p className="text-2xl font-semibold">{meets.length}</p><p className="text-xs text-mute">Meetings</p></div><div><p className="text-2xl font-semibold">{inr(mine.filter(isWon).filter((d) => (d.closedAt ?? '') >= iso(-30)).reduce((s, d) => s + val(d), 0))}</p><p className="text-xs text-mute">Won</p></div></div></div>
          <div className="box"><p className="mb-3 font-medium">Recent activity</p>
            {act.length === 0 ? <p className="text-sm text-mute">No recorded activity yet.</p> : <ul className="grid gap-2 text-sm">{act.slice(0, 5).map((a) => <li key={a.id} className="flex justify-between gap-3"><span className="min-w-0">{a.text}<span className="block text-xs text-mute">{co(a.dealId)}</span></span><span className="shrink-0 text-xs text-mute">{fmt(a.at)}</span></li>)}</ul>}</div>
        </div></>}

      {tab === 'Deals' && <div className="box overflow-x-auto"><p className="mb-3 font-medium">{mine.length} deals <span className="text-sm font-normal text-mute">· {inr(open.reduce((s, d) => s + val(d), 0))} open · {inr(mine.filter(isWon).reduce((s, d) => s + val(d), 0))} won · {mine.filter(isLost).length} lost</span></p>
        {mine.length === 0 ? <p className="text-sm text-mute">No deals assigned.</p> : <table className="w-full text-left text-sm"><thead><tr><th className="pb-2 pr-3">Deal</th><th className="pr-3">Status</th><th className="pr-3">Value</th><th className="pr-3">Risk</th><th className="pr-3">Target</th><th>Note</th></tr></thead>
          <tbody>{[...open, ...mine.filter((d) => d.stage === 4)].map(dealRow)}</tbody></table>}</div>}

      {tab === 'Calls & meetings' && <div className="box"><p className="mb-1 font-medium">Calls and meetings</p><p className="mb-4 text-xs text-mute">{calls.length} calls and {meets.length} meetings in the last 30 days · {rec.length} entries in total</p>
        {rec.length === 0 ? <p className="text-sm text-mute">{u.name} hasn’t logged any calls or meetings yet.</p> : <ul className="grid gap-3">{rec.slice(0, 40).map((x) => <li key={x.id} className="rounded-lg border border-line p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex flex-wrap items-center gap-2"><b>{x.type}</b>{x.contact && <span className="text-mute">with {x.contact}</span>}{x.duration ? <span className="text-xs text-mute">· {x.duration} min</span> : null}{x.outcome && <span className="pill bg-brand/10 text-brand">{x.outcome}</span>}</span><span className="text-xs text-mute">{fmt(x.at)}</span></div>
          <Link href={`/${r}/deals/${x.dealId}`} className="mt-1 block text-xs text-mute hover:text-brand">{co(x.dealId)}</Link><p className="mt-1">{x.text}</p>{x.next && <p className="mt-1 text-xs text-mute">Next: {x.next}{x.nextDue && ` · ${x.nextDue}`}</p>}</li>)}</ul>}</div>}

      {tab === 'Tasks' && <div className="grid gap-4 lg:grid-cols-2">{([['Overdue', tk.filter((t) => !t.done && t.due < today), 'text-red-500'], ['Today', tk.filter((t) => !t.done && t.due === today), 'text-brand'], ['Upcoming', tk.filter((t) => !t.done && t.due > today), 'text-ink'], ['Done', tk.filter((t) => t.done), 'text-mute']] as const).map(([n, list, c]) => <div key={n} className="box">
        <p className={`mb-3 font-medium ${c}`}>{n} <span className="text-sm font-normal text-mute">({list.length})</span></p>
        {list.length === 0 ? <p className="text-sm text-mute">Nothing here.</p> : <ul className="grid gap-2">{list.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"><Link href={`/${r}/deals/${t.dealId}`} className="min-w-0 hover:text-brand"><span className="block truncate">{t.title}{t.kind === 'followup' && <span className="pill ml-2 bg-brand/10 text-brand">Follow-up</span>}</span><span className="text-xs text-mute">{co(t.dealId)}</span></Link><span className={`shrink-0 text-xs ${t.done ? 'text-mute' : dueLabel(t.due)[1]}`}>{t.done ? t.due : dueLabel(t.due)[0]}</span></li>)}</ul>}</div>)}</div>}

      {tab === 'Activity' && <div className="box overflow-x-auto"><p className="mb-3 font-medium">Everything {u.name} has done <span className="text-sm font-normal text-mute">({act.length})</span></p>
        {act.length === 0 ? <p className="text-sm text-mute">No recorded activity yet.</p> : <table className="w-full text-left text-sm"><thead><tr><th className="pb-2 pr-4">Time</th><th className="pr-4">Deal</th><th>Action</th></tr></thead>
          <tbody>{act.slice(0, 100).map((a) => <tr key={a.id} className="border-t border-line align-top"><td className="whitespace-nowrap py-2 pr-4 text-xs text-mute">{fmt(a.at)}</td><td className="pr-4">{a.dealId ? <Link href={`/${r}/deals/${a.dealId}`} className="hover:text-brand">{co(a.dealId)}</Link> : '—'}</td><td>{a.text}</td></tr>)}</tbody></table>}</div>}

      {tab === 'Profile' && <RepProgress key={u.id} user={u} manager progress={false} />}
    </Shell>)
}
