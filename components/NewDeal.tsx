'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { useStore, Role } from '@/lib/store'
import { toast } from '@/components/Toaster'
import { useEsc } from '@/components/useEsc'
export default function NewDeal({ role }: { role: Role }) {
  const { addDeal, users } = useStore(); const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name); const reps = users.filter((u) => u.role === 'rep'); const r = useRouter(); const [open, setOpen] = useState(false); useEsc(open, () => setOpen(false))
  const [f, setF] = useState({ company: '', client: '', gst: '', target: '', rep: '', risk: 'Low' as 'Low' | 'Medium' | 'High' })
  const save = () => { const id = addDeal({ company: f.company, client: f.client, gst: f.gst, target: f.target, risk: f.risk, rep: role === 'rep' ? myName || '' : f.rep || reps[0]?.name || '', notes: '' }); toast('Deal created'); setOpen(false); r.push(`/${role}/deals/${id}`) }
  return (<>
    <button className="btn flex items-center gap-1" onClick={() => setOpen(true)}><Plus size={16} />New deal</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/50 p-0 md:place-items-center md:p-4" onClick={() => setOpen(false)}>
      <div role="dialog" aria-label="New deal" className="w-full max-w-md rounded-t-xl glass-dialog p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><p className="text-lg font-semibold">New deal</p><button aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button></div>
        <div className="grid gap-3">
          <input autoFocus className="inp" placeholder="Company name" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
          <input className="inp" placeholder="Client name" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} />
          <input className="inp" placeholder="GST number (optional)" maxLength={15} value={f.gst} onChange={(e) => setF({ ...f, gst: e.target.value.toUpperCase() })} />
          <div className="grid grid-cols-2 gap-3"><input type="date" className="inp" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} aria-label="Target date" />
            <select className="inp" value={f.risk} onChange={(e) => setF({ ...f, risk: e.target.value as 'Low' })}>{['Low', 'Medium', 'High'].map((x) => <option key={x}>{x}</option>)}</select></div>
          {role !== 'rep' && <label className="grid gap-1 text-sm">Assign to rep<select className="inp" value={f.rep || reps[0]?.name} onChange={(e) => setF({ ...f, rep: e.target.value })}>{reps.map((u) => <option key={u.id}>{u.name}</option>)}</select></label>}
          <button className="btn" disabled={!f.company.trim() || !f.client.trim()} onClick={save}>Create deal</button>
        </div></div></div>}
  </>)
}
