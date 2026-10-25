'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Download } from 'lucide-react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import RepLink from '@/components/RepLink'
import { useStore, Role } from '@/lib/store'
const CATS: [string, RegExp][] = [
  ['Approvals', /approved|rejected|Approval/i], ['Quotes', /^Quote /], ['Stages & closing', /Stage changed|Deal closed|Deal cancelled|Deal created/],
  ['Invoices & payments', /Invoice|payment/i], ['Messages', /^(Email|WhatsApp) opened/], ['Calls & meetings', /^(Call|Meeting|Email|Note) (logged|added)/], ['Follow-ups', /^Follow-up/], ['Tasks', /^Task/], ['Accounts', /account/i]]
const catOf = (t: string) => CATS.find(([, re]) => re.test(t))?.[0] ?? 'Other'
const fmt = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const ROLE = { rep: 'bg-slate-500/15 text-slate-500', admin: 'bg-brand/15 text-brand', ceo: 'bg-green-600/15 text-green-600' }
export default function Audit() {
  const role = useParams().role as Role; const { activity, deals } = useStore()
  const [q, setQ] = useState(''); const [who, setWho] = useState('All'); const [cat, setCat] = useState('All'); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [n, setN] = useState(50)
  if (role === 'rep') return <Shell role={role}><p className="box text-sm text-mute">The audit log is available to Admin and CEO.</p></Shell>
  const co = (id: string) => deals.find((d) => d.id === id)?.company
  const people = [...new Set(activity.map((a) => a.by || 'System'))].sort()
  const rows = [...activity].sort((a, b) => b.at.localeCompare(a.at)).filter((a) => (who === 'All' || (a.by || 'System') === who) && (cat === 'All' || catOf(a.text) === cat)
    && (!from || a.at.slice(0, 10) >= from) && (!to || a.at.slice(0, 10) <= to) && (a.text + (co(a.dealId) || '') + (a.by || '')).toLowerCase().includes(q.toLowerCase()))
  const csv = () => { const body = rows.map((a) => [a.at, a.by || 'System', a.byRole || '', co(a.dealId) || '', catOf(a.text), a.text].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))
    const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([['Time,User,Role,Deal,Category,Action', ...body].join('\n')], { type: 'text/csv' })); el.download = 'audit-log.csv'; el.click(); toast('CSV downloaded') }
  return (
    <Shell role={role} wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Audit log</h1><p className="text-sm text-mute">Who did what, and when. {rows.length} of {activity.length} entries.</p></div>
        <button className="btn2 flex items-center gap-2" onClick={csv}><Download size={16} />Export CSV</button></div>
      <div className="box mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="grid min-w-0 gap-1 text-xs font-medium text-mute sm:col-span-2">Search<input className="inp" placeholder="Search action, deal or person" value={q} onChange={(e) => { setQ(e.target.value); setN(50) }} /></label>
        <label className="grid min-w-0 gap-1 text-xs font-medium text-mute">User<select className="inp" value={who} onChange={(e) => setWho(e.target.value)}><option value="All">All users</option>{people.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="grid min-w-0 gap-1 text-xs font-medium text-mute">Category<select className="inp" value={cat} onChange={(e) => setCat(e.target.value)}><option value="All">All categories</option>{[...CATS.map((c) => c[0]), 'Other'].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="grid min-w-0 gap-1 text-xs font-medium text-mute">From<input type="date" className="inp" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-xs font-medium text-mute">To<input type="date" className="inp" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <div className="box overflow-x-auto">
        {rows.length === 0 ? <p className="py-6 text-center text-sm text-mute">No entries match these filters.</p> :
          <table className="w-full text-left text-sm"><thead className="text-xs text-mute"><tr><th className="py-2 pr-4">Time</th><th className="pr-4">User</th><th className="pr-4">Deal</th><th className="pr-4">Category</th><th>Action</th></tr></thead>
            <tbody>{rows.slice(0, n).map((a) => <tr key={a.id} className="border-t border-line align-top">
              <td className="whitespace-nowrap py-2 pr-4 text-xs text-mute">{fmt(a.at)}</td>
              <td className="whitespace-nowrap pr-4"><RepLink name={a.by || 'System'} /> {a.byRole && <span className={`pill ml-1 !px-2 !py-0.5 uppercase ${ROLE[a.byRole]}`}>{a.byRole}</span>}</td>
              <td className="pr-4">{co(a.dealId) ? <Link href={`/${role}/deals/${a.dealId}`} className="hover:text-brand">{co(a.dealId)}</Link> : <span className="text-mute">—</span>}</td>
              <td className="whitespace-nowrap pr-4 text-xs text-mute">{catOf(a.text)}</td><td>{a.text}</td></tr>)}</tbody></table>}
        {rows.length > n && <button className="btn2 mx-auto mt-3 block" onClick={() => setN(n + 50)}>Show more ({rows.length - n} left)</button>}
      </div>
    </Shell>)
}
