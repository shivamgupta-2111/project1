'use client'
import { useParams } from 'next/navigation'
import { Download } from 'lucide-react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import Link from 'next/link'
import { useStore, Role, STAGES, LOST_REASONS, dealValue, discountPct, isWon, isLost, arrOf } from '@/lib/store'
const PROB = [0.1, 0.25, 0.5, 0.75, 1]
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
function Bars({ rows, fmt = inr }: { rows: [string, number][]; fmt?: (n: number) => string }) {
  const m = Math.max(1, ...rows.map((r) => r[1]))
  return <div className="grid gap-3">{rows.map(([l, v]) => <div key={l}><div className="flex justify-between text-sm"><span>{l}</span><span className="text-mute">{fmt(v)}</span></div><div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${(v / m) * 100}%` }} /></div></div>)}</div>
}
export default function Reports() {
  const role = useParams().role as Role; const { deals, quotes, activity } = useStore()
  if (role === 'rep') return <Shell role={role}><p className="box text-sm text-mute">Reports are available to Admin and CEO.</p></Shell>
  const val = (id: string) => dealValue(quotes, id); const open = deals.filter((d) => d.stage < 4)
  const pipeline = open.reduce((s, d) => s + val(d.id), 0); const weighted = open.reduce((s, d) => s + val(d.id) * PROB[d.stage], 0)
  const won = deals.filter(isWon); const wonVal = won.reduce((s, d) => s + val(d.id), 0)
  const arr = won.reduce((s, d) => { const f = quotes.find((q) => q.dealId === d.id && q.final); return s + (f ? arrOf(f) : 0) }, 0); const lost = deals.filter(isLost)
  const disc = quotes.length ? quotes.reduce((s, q) => s + discountPct(q), 0) / quotes.length : 0
  const months = [...new Set(open.map((d) => d.target.slice(0, 7)))].sort()
  const fc = months.map((m) => [new Date(m + '-01').toLocaleString('en-IN', { month: 'short', year: '2-digit' }), open.filter((d) => d.target.startsWith(m)).reduce((s, d) => s + val(d.id) * PROB[d.stage], 0)] as [string, number])
  const reps = [...new Set(deals.map((d) => d.rep))]
  const csv = () => { const rows = deals.map((d) => [d.company, d.client, d.rep, STAGES[d.stage], d.risk, d.target, Math.round(val(d.id))].map((x) => `"${x}"`).join(','))
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([['Deal,Client,Rep,Stage,Risk,Target,Value', ...rows].join('\n')], { type: 'text/csv' })); a.download = 'deals.csv'; a.click(); toast('CSV downloaded') }
  const dl = (name: string, head: string[], rows: (string | number)[][]) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([[head.join(','), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n')], { type: 'text/csv' })); a.download = name; a.click(); toast('CSV downloaded') }
  const reasonOf = (d: { lostReason?: string }) => d.lostReason || 'Not recorded'
  const reasons = [...LOST_REASONS, 'Not recorded'].map((r) => ({ r, n: lost.filter((d) => reasonOf(d) === r).length, v: lost.filter((d) => reasonOf(d) === r).reduce((s, d) => s + val(d.id), 0) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
  const lostByRep = reps.map((r) => [r, lost.filter((d) => d.rep === r).length] as [string, number]).filter((x) => x[1] > 0)
  const outreach = activity.filter((a) => /^(Email|WhatsApp) opened/.test(a.text)); const outBy = [...new Set(outreach.map((a) => a.by || 'System'))].map((n) => [n, outreach.filter((a) => (a.by || 'System') === n).length] as [string, number])
  const kpi = [['Open pipeline', inr(pipeline)], ['Weighted forecast', inr(weighted)], ['Won revenue', inr(wonVal)], ['Conversion', `${Math.round((won.length / Math.max(deals.length, 1)) * 100)}%`], ['Avg discount', disc.toFixed(1) + '%'], ['ARR (won)', inr(arr)], ['MRR (won)', inr(arr / 12)], ['Churned deals', `${lost.length} · ${inr(lost.reduce((s, d) => s + val(d.id), 0))}`], ['Top loss reason', reasons[0] ? `${reasons[0].r} (${reasons[0].n})` : '—'], ['Win rate (closed)', `${Math.round((won.length / Math.max(won.length + lost.length, 1)) * 100)}%`]]
  return (
    <Shell role={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Reports</h1><p className="text-sm text-mute">Forecast is weighted by stage: 10%, 25%, 50%, 75%, 100%.</p></div>
        <button className="btn2 flex items-center gap-2" onClick={csv}><Download size={16} />Export CSV</button></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{kpi.map(([k, v]) => <div key={k} className="box"><p className="text-sm text-mute">{k}</p><p className="mt-1 text-xl font-semibold">{v}</p></div>)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="box"><p className="mb-4 font-medium">Forecast by month</p><Bars rows={fc} /></div>
        <div className="box"><p className="mb-4 font-medium">Pipeline funnel (deals)</p><Bars fmt={(n) => String(n)} rows={STAGES.map((s, i) => [s, deals.filter((d) => d.stage === i).length])} /></div>
        <div className="box"><p className="mb-4 font-medium">Pipeline value by rep</p><Bars rows={reps.map((r) => [r, open.filter((d) => d.rep === r).reduce((s, d) => s + val(d.id), 0)])} /></div>
        <div className="box"><p className="mb-4 font-medium">Average discount by rep</p><Bars fmt={(n) => n.toFixed(1) + '%'} rows={reps.map((r) => { const q = quotes.filter((x) => deals.find((d) => d.id === x.dealId)?.rep === r); return [r, q.length ? q.reduce((s, x) => s + discountPct(x), 0) / q.length : 0] })} /></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="box"><p className="mb-1 font-medium text-red-500">Lost reasons</p><p className="mb-4 text-xs text-mute">Why deals were cancelled (number of deals)</p>
          {reasons.length === 0 ? <p className="text-sm text-mute">No cancelled deals yet.</p> : <Bars fmt={(n) => String(n)} rows={reasons.map((x) => [x.r, x.n])} />}</div>
        <div className="box"><p className="mb-1 font-medium text-red-500">Revenue lost by reason</p><p className="mb-4 text-xs text-mute">Quoted value of cancelled deals</p>
          {reasons.length === 0 ? <p className="text-sm text-mute">No cancelled deals yet.</p> : <Bars rows={reasons.map((x) => [x.r, x.v])} />}</div>
        <div className="box"><p className="mb-4 font-medium">Cancelled deals by rep</p>{lostByRep.length === 0 ? <p className="text-sm text-mute">None.</p> : <Bars fmt={(n) => String(n)} rows={lostByRep} />}</div>
        <div className="box"><p className="mb-1 font-medium">Client outreach by rep</p><p className="mb-4 text-xs text-mute">Emails and WhatsApp messages opened from templates</p>{outBy.length === 0 ? <p className="text-sm text-mute">No messages sent from templates yet.</p> : <Bars fmt={(n) => String(n)} rows={outBy} />}</div>
      </div>
      <div className="box mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="font-medium">Lost deals</p>
          <button className="btn2 flex items-center gap-2" onClick={() => dl('lost-deals.csv', ['Deal', 'Client', 'Rep', 'Reason', 'Note', 'Value', 'Closed'], lost.map((d) => [d.company, d.client, d.rep, reasonOf(d), d.closeNote || '', Math.round(val(d.id)), d.closedAt || '']))}><Download size={16} />Export lost deals</button></div>
        {lost.length === 0 ? <p className="text-sm text-mute">No cancelled deals yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-mute"><tr><th className="py-2 pr-3">Deal</th><th className="pr-3">Rep</th><th className="pr-3">Reason</th><th className="pr-3">Note</th><th className="pr-3 text-right">Value</th><th>Closed</th></tr></thead>
          <tbody>{lost.map((d) => <tr key={d.id} className="border-t border-line"><td className="py-2 pr-3"><Link href={`/${role}/deals/${d.id}`} className="font-medium hover:text-brand">{d.company}</Link></td><td className="pr-3">{d.rep}</td><td className="pr-3"><span className="pill bg-red-500/10 text-red-500">{reasonOf(d)}</span></td><td className="max-w-[260px] truncate pr-3 text-mute">{d.closeNote}</td><td className="pr-3 text-right">{inr(val(d.id))}</td><td className="text-mute">{d.closedAt}</td></tr>)}</tbody></table></div>}
      </div>
    </Shell>)
}
