'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore, PLATFORMS, Rec } from '@/lib/store'
import QuickTask from '@/components/QuickTask'
const fmt = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export default function DealTabs({ dealId, who }: { dealId: string; who: string }) {
  const { activity, records, socials, addRecord, addSocial, removeSocial, tasks, toggleTask } = useStore(); const tl = tasks.filter((t) => t.dealId === dealId)
  const [tab, setTab] = useState<'Activity' | 'Records' | 'Tasks' | 'Social media'>('Activity')
  const [type, setType] = useState<Rec['type']>('Call'); const [text, setText] = useState('')
  const [pf, setPf] = useState(PLATFORMS[0]); const [handle, setHandle] = useState('')
  const acts = activity.filter((a) => a.dealId === dealId); const recs = records.filter((r) => r.dealId === dealId); const soc = socials.filter((x) => x.dealId === dealId)
  return (
    <div className="box mt-4">
      <div className="mb-4 flex gap-1 border-b border-line">{(['Activity', 'Records', 'Tasks', 'Social media'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-brand text-brand' : 'border-transparent text-mute'}`}>{t}</button>)}</div>
      {tab === 'Activity' && (acts.length === 0 ? <p className="text-sm text-mute">No activity yet. Stage changes, quotes and records show up here.</p> :
        <ul className="grid max-h-72 gap-3 overflow-y-auto scroll-y pr-1">{acts.map((a) => <li key={a.id} className="flex justify-between gap-3 text-sm"><span>{a.text}</span><span className="shrink-0 text-xs text-mute">{fmt(a.at)}</span></li>)}</ul>)}
      {tab === 'Records' && <>
        <div className="mb-4 grid gap-2 md:grid-cols-[120px_1fr_auto]">
          <select className="inp" value={type} onChange={(e) => setType(e.target.value as Rec['type'])}>{['Call', 'Meeting', 'Email', 'Note'].map((t) => <option key={t}>{t}</option>)}</select>
          <input className="inp" placeholder="What happened?" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn" disabled={!text.trim()} onClick={() => { addRecord(dealId, type, text.trim(), who); setText('') }}>Add record</button></div>
        {recs.length === 0 ? <p className="text-sm text-mute">No records yet. Log calls, meetings and notes here.</p> :
          <ul className="grid max-h-72 gap-3 overflow-y-auto scroll-y pr-1">{recs.map((r) => <li key={r.id} className="rounded-2xl border border-line p-3 text-sm"><div className="flex justify-between text-xs text-mute"><span>{r.type} · {r.by}</span><span>{fmt(r.at)}</span></div><p className="mt-1">{r.text}</p></li>)}</ul>}</>}
      {tab === 'Tasks' && <><div className="mb-4"><QuickTask dealId={dealId} /></div>{tl.length === 0 ? <p className="text-sm text-mute">No tasks for this deal yet.</p> : <ul className="grid max-h-72 gap-2 overflow-y-auto scroll-y pr-1">{tl.map((t) => <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#2563eb]" checked={t.done} onChange={() => toggleTask(t.id)} aria-label="Mark done" /><span className={t.done ? 'text-mute line-through' : ''}>{t.title}</span><span className="ml-auto text-xs text-mute">{t.due}</span></li>)}</ul>}</>}
      {tab === 'Social media' && <>
        <div className="mb-4 grid gap-2 md:grid-cols-[160px_1fr_auto]">
          <select className="inp" value={pf} onChange={(e) => setPf(e.target.value)}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
          <input className="inp" placeholder="Handle or link" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button className="btn" disabled={!handle.trim()} onClick={() => { addSocial(dealId, pf, handle.trim()); setHandle('') }}>Add account</button></div>
        {soc.length === 0 ? <p className="text-sm text-mute">No accounts added. Add the client’s LinkedIn, Instagram or website.</p> :
          <ul className="grid max-h-72 gap-2 overflow-y-auto scroll-y pr-1">{soc.map((x) => <li key={x.id} className="flex items-center justify-between rounded-2xl border border-line px-3 py-2 text-sm"><span><b>{x.platform}</b> · {x.handle.startsWith('http') ? <a className="text-brand underline" href={x.handle} target="_blank" rel="noreferrer">{x.handle}</a> : x.handle}</span><button aria-label="Remove" onClick={() => removeSocial(x.id)} className="text-mute"><Trash2 size={16} /></button></li>)}</ul>}</>}
    </div>)
}
