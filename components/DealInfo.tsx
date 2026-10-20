'use client'
import { useState } from 'react'
import { Trash2, Upload, Phone, Mail } from 'lucide-react'
import { useStore } from '@/lib/store'
import Avatar from '@/components/Avatar'
const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export default function DealInfo({ dealId }: { dealId: string }) {
  const { deals, contacts, files, updateDeal, addContact, delContact, addFiles, delFile } = useStore()
  const d = deals.find((x) => x.id === dealId)!; const cs = contacts.filter((c) => c.dealId === dealId); const fs = files.filter((f) => f.dealId === dealId)
  const [c, setC] = useState({ name: '', phone: '', email: '' }); const [over, setOver] = useState(false)
  const gstOk = !d.gst || GST.test(d.gst.toUpperCase())
  const pick = (l: FileList | null) => l && l.length && addFiles(dealId, Array.from(l).map((f) => ({ name: f.name, size: f.size })))
  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
      <div className="box grid content-start gap-3">
        <p className="font-medium">Deal details</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">Risk level<select className="inp" value={d.risk} onChange={(e) => updateDeal(d.id, { risk: e.target.value as 'Low' })}>{['Low', 'Medium', 'High'].map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Target date<input type="date" className="inp" value={d.target} onChange={(e) => updateDeal(d.id, { target: e.target.value })} /></label></div>
        <label className="grid gap-1 text-sm">GST number<input className={`inp ${gstOk ? '' : 'border-red-500'}`} value={d.gst} maxLength={15} onChange={(e) => updateDeal(d.id, { gst: e.target.value.toUpperCase() })} />
          {!gstOk && <span className="text-xs text-red-500">GST must be 15 characters, like 27AAAAA0000A1Z5</span>}</label>
        <label className="grid gap-1 text-sm">Notes<textarea rows={3} className="inp" value={d.notes} onChange={(e) => updateDeal(d.id, { notes: e.target.value })} /></label>
      </div>
      <div className="grid gap-4">
        <div className="box">
          <p className="mb-3 font-medium">Contact details</p>
          <div className="grid gap-2 md:grid-cols-3"><input className="inp" placeholder="Name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /><input className="inp" placeholder="Phone" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /><input className="inp" placeholder="Email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></div>
          <button className="btn mt-2" disabled={!c.name.trim()} onClick={() => { addContact({ ...c, dealId }); setC({ name: '', phone: '', email: '' }) }}>Add contact</button>
          <ul className="mt-3 grid scroll-y max-h-44 gap-2 overflow-y-auto pr-1">{cs.map((x) => <li key={x.id} className="flex items-center justify-between rounded-full border border-line px-3 py-2 text-sm"><span className="flex items-center gap-3"><Avatar name={x.name} size={32} /><span><b>{x.name}</b><span className="block text-xs text-mute">{x.phone} {x.email}</span></span></span>
            <span className="flex items-center gap-3">{x.phone && <a aria-label="Call" href={`tel:${x.phone}`}><Phone size={16} className="text-brand" /></a>}{x.email && <a aria-label="Email" href={`mailto:${x.email}`}><Mail size={16} className="text-brand" /></a>}<button aria-label="Remove" onClick={() => delContact(x.id)}><Trash2 size={16} className="text-mute" /></button></span></li>)}</ul>
        </div>
        <div className="box">
          <p className="mb-3 font-medium">Files</p>
          <label onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files) }}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-full border-2 border-dashed p-5 text-sm text-mute ${over ? 'border-brand bg-brand/10' : 'border-line'}`}>
            <Upload size={20} className="text-brand" />Drop files here or tap to choose<input type="file" multiple hidden onChange={(e) => pick(e.target.files)} /></label>
          <ul className="mt-3 grid scroll-y max-h-44 gap-2 overflow-y-auto pr-1">{fs.map((f) => <li key={f.id} className="flex justify-between rounded-full border border-line px-3 py-2 text-sm"><span>{f.name} <span className="text-xs text-mute">{Math.max(1, Math.round(f.size / 1024))} KB</span></span><button aria-label="Remove" onClick={() => delFile(f.id)}><Trash2 size={16} className="text-mute" /></button></li>)}</ul>
          <p className="mt-2 text-xs text-mute">Demo: file names are saved, the files themselves are not uploaded.</p>
        </div>
      </div>
    </div>)
}
