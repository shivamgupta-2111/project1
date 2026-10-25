'use client'
import { useState } from 'react'
import { Trash2, Phone, Users, Mail, StickyNote, CalendarClock } from 'lucide-react'
import { useStore, PLATFORMS, Rec, OUTCOMES } from '@/lib/store'
import RepLink from '@/components/RepLink'
import { toast } from '@/components/Toaster'
import QuickTask from '@/components/QuickTask'
const fmt = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const ICON = { Call: Phone, Meeting: Users, Email: Mail, Note: StickyNote }
const OC: Record<string, string> = { Interested: 'bg-green-500/15 text-green-600', 'Deal progressed': 'bg-green-500/15 text-green-600', 'Needs follow-up': 'bg-amber-500/15 text-amber-600', 'Not interested': 'bg-red-500/15 text-red-500', 'No answer': 'bg-slate-500/15 text-slate-500', 'Left voicemail': 'bg-slate-500/15 text-slate-500' }
const localNow = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
const ago = (iso: string) => { const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago` }
export default function DealTabs({ dealId, who }: { dealId: string; who: string }) {
  const { activity, records, socials, contacts, deals, addRecord, addSocial, removeSocial, tasks, toggleTask } = useStore(); const tl = tasks.filter((t) => t.dealId === dealId)
  const [tab, setTab] = useState<'Activity' | 'Call log' | 'Tasks' | 'Social media'>('Call log')
  const d = deals.find((x) => x.id === dealId); const names = [...new Set([d?.client || '', ...contacts.filter((c) => c.dealId === dealId).map((c) => c.name)].filter(Boolean))]
  const blank = { type: 'Call' as Rec['type'], contact: '', when: localNow(), duration: '', outcome: 'Needs follow-up', text: '', next: '', nextDue: '' }
  const [f, setF] = useState(blank); const [flt, setFlt] = useState<'All' | Rec['type']>('All')
  const [pf, setPf] = useState(PLATFORMS[0]); const [handle, setHandle] = useState('')
  const acts = activity.filter((a) => a.dealId === dealId); const soc = socials.filter((x) => x.dealId === dealId)
  const recs = records.filter((r) => r.dealId === dealId).sort((a, b) => b.at.localeCompare(a.at)); const shown = recs.filter((r) => flt === 'All' || r.type === flt)
  const talk = f.type === 'Call' || f.type === 'Meeting'; const last = recs.find((r) => r.type !== 'Note')
  const save = () => { addRecord(dealId, f.type, f.text.trim(), who, { at: new Date(f.when || Date.now()).toISOString(), contact: f.contact || names[0], duration: talk && f.duration ? Number(f.duration) : undefined, outcome: talk ? f.outcome : undefined, next: f.next.trim() || undefined, nextDue: f.next.trim() && f.nextDue ? f.nextDue : undefined })
    toast(f.next.trim() && f.nextDue ? `${f.type} logged · follow-up set for ${f.nextDue}` : `${f.type} logged`); setF({ ...blank, when: localNow() }) }
  return (
    <div className="box mt-4">
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">{(['Call log', 'Activity', 'Tasks', 'Social media'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-brand text-brand' : 'border-transparent text-mute'}`}>{t === 'Call log' ? 'Call & meeting log' : t}{t === 'Call log' && recs.length > 0 && <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 text-[11px] text-brand">{recs.length}</span>}</button>)}</div>
      {tab === 'Activity' && (acts.length === 0 ? <p className="text-sm text-mute">No activity yet. Stage changes, quotes and records show up here.</p> :
        <ul className="grid max-h-72 gap-3 overflow-y-auto scroll-y pr-1">{acts.map((a) => <li key={a.id} className="flex justify-between gap-3 text-sm"><span>{a.text}{a.by && <span className="text-xs text-mute"> · {a.by}</span>}</span><span className="shrink-0 text-xs text-mute">{fmt(a.at)}</span></li>)}</ul>)}
      {tab === 'Call log' && <>
        <div className="mb-4 grid gap-3 rounded-lg border border-line bg-ink/[0.02] p-3">
          <div className="grid gap-2 md:grid-cols-4">
            <label className="grid gap-1 text-xs font-medium text-mute">Type<select className="inp" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Rec['type'] })}>{['Call', 'Meeting', 'Email', 'Note'].map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-medium text-mute">With<select className="inp" value={f.contact || names[0] || ''} onChange={(e) => setF({ ...f, contact: e.target.value })}>{names.map((n) => <option key={n}>{n}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-medium text-mute">When<input type="datetime-local" max={localNow()} className="inp" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} /></label>
            {talk && <label className="grid gap-1 text-xs font-medium text-mute">Duration (minutes)<input type="number" min={1} className="inp" placeholder="e.g. 15" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></label>}</div>
          {talk && <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-mute">Outcome</span>{OUTCOMES.map((o) => <button key={o} onClick={() => setF({ ...f, outcome: o })} className={`rounded-lg border px-2.5 py-1 text-xs ${f.outcome === o ? 'border-brand bg-brand/10 text-brand' : 'border-line text-mute hover:bg-ink/5'}`}>{o}</button>)}</div>}
          <label className="grid gap-1 text-xs font-medium text-mute">{f.type === 'Note' ? 'Note' : 'What was discussed?'}<textarea rows={2} className="inp" placeholder="Key points, objections, decisions…" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></label>
          <div className="grid gap-2 md:grid-cols-[1fr_170px_auto] md:items-end">
            <label className="grid gap-1 text-xs font-medium text-mute">Next step (optional)<input className="inp" placeholder="e.g. Send revised quote" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
            <label className="grid gap-1 text-xs font-medium text-mute">Next step date<input type="date" className="inp" disabled={!f.next.trim()} value={f.nextDue} onChange={(e) => setF({ ...f, nextDue: e.target.value })} /></label>
            <button className="btn" disabled={!f.text.trim()} onClick={save}>Log {f.type.toLowerCase()}</button></div>
          {f.next.trim() && f.nextDue && <p className="text-xs text-mute">A follow-up reminder will be created for {f.nextDue}.</p>}
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">{(['All', 'Call', 'Meeting', 'Email', 'Note'] as const).map((t) => <button key={t} onClick={() => setFlt(t)} className={`rounded-md border px-2.5 py-1 text-xs ${flt === t ? 'border-brand bg-brand/10 text-brand' : 'border-line text-mute'}`}>{t === 'All' ? `All (${recs.length})` : `${t}s (${recs.filter((r) => r.type === t).length})`}</button>)}</div>
          <span className="text-xs text-mute">{last ? `Last contact ${ago(last.at)}` : 'No contact logged yet'}</span></div>
        {shown.length === 0 ? <p className="text-sm text-mute">Nothing logged yet. Record every call and meeting so the whole team knows where this deal stands.</p> :
          <ul className="grid max-h-96 gap-3 overflow-y-auto scroll-y pr-1">{shown.map((r) => { const I = ICON[r.type]
            return <li key={r.id} className="rounded-lg border border-line p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex flex-wrap items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-brand/10 text-brand"><I size={14} /></span><b>{r.type}</b>{r.contact && <span className="text-mute">with {r.contact}</span>}{r.duration ? <span className="text-xs text-mute">· {r.duration} min</span> : null}{r.outcome && <span className={`pill ${OC[r.outcome] || 'bg-slate-500/15 text-slate-500'}`}>{r.outcome}</span>}</span>
                <span className="text-xs text-mute">{fmt(r.at)} · <RepLink name={r.by} /></span></div>
              <p className="mt-2">{r.text}</p>
              {r.next && <p className="mt-2 flex items-center gap-1.5 text-xs text-mute"><CalendarClock size={13} className="text-brand" />Next: {r.next}{r.nextDue && ` · ${r.nextDue}`}</p>}</li> })}</ul>}</>}
      {tab === 'Tasks' && <><div className="mb-4"><QuickTask dealId={dealId} /></div>{tl.length === 0 ? <p className="text-sm text-mute">No tasks for this deal yet.</p> : <ul className="grid max-h-72 gap-2 overflow-y-auto scroll-y pr-1">{tl.map((t) => <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#e87722]" checked={t.done} onChange={() => toggleTask(t.id)} aria-label="Mark done" /><span className={t.done ? 'text-mute line-through' : ''}>{t.title}</span>{t.kind === 'followup' && <span className="pill bg-brand/10 text-brand">Follow-up</span>}<span className="ml-auto text-xs text-mute">{t.due}</span></li>)}</ul>}</>}
      {tab === 'Social media' && <>
        <div className="mb-4 grid gap-2 md:grid-cols-[160px_1fr_auto]">
          <select className="inp" value={pf} onChange={(e) => setPf(e.target.value)}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
          <input className="inp" placeholder="Handle or link" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button className="btn" disabled={!handle.trim()} onClick={() => { addSocial(dealId, pf, handle.trim()); setHandle('') }}>Add account</button></div>
        {soc.length === 0 ? <p className="text-sm text-mute">No accounts added. Add the client’s LinkedIn, Instagram or website.</p> :
          <ul className="grid max-h-72 gap-2 overflow-y-auto scroll-y pr-1">{soc.map((x) => <li key={x.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"><span><b>{x.platform}</b> · {x.handle.startsWith('http') ? <a className="text-brand underline" href={x.handle} target="_blank" rel="noreferrer">{x.handle}</a> : x.handle}</span><button aria-label="Remove" onClick={() => removeSocial(x.id)} className="text-mute"><Trash2 size={16} /></button></li>)}</ul>}</>}
    </div>)
}
