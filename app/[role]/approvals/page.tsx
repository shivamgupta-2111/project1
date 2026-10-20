'use client'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { useStore, Role, discountPct, total, origTotal, subTotal, discAmt } from '@/lib/store'
export default function Approvals() {
  const role = useParams().role as Role; const { quotes, deals, decide } = useStore(); const [c, setC] = useState<Record<string, string>>({})
  const list = quotes.filter((q) => q.status === 'Pending approval' && (role === 'ceo' || q.need === 'admin'))
  return (
    <Shell role={role}>
      <h1 className="mb-3 text-lg font-semibold">Approval queue</h1>
      {list.length === 0 && <p className="box text-sm text-mute">Nothing waiting. New requests appear here.</p>}
      <div className="grid gap-3">{list.map((q) => { const d = deals.find((x) => x.id === q.dealId)
        return <div key={q.id} className="box">
          <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{q.id} · {d?.company}</p><p className="text-sm">{discountPct(q).toFixed(1)}% off · ₹{Math.round(total(q)).toLocaleString('en-IN')}</p></div>
          <p className="mt-2 text-sm"><span className="text-mute line-through">₹{Math.round(origTotal(q)).toLocaleString('en-IN')}</span> → <b>₹{Math.round(subTotal(q)).toLocaleString('en-IN')}</b> <span className="text-mute">before GST · discount ₹{Math.round(discAmt(q)).toLocaleString('en-IN')}</span></p>
          <p className="mt-1 text-sm text-mute">Reason: {q.reason}</p>
          <input className="inp mt-3" placeholder="Comment (optional)" value={c[q.id] || ''} onChange={(e) => setC({ ...c, [q.id]: e.target.value })} />
          <div className="mt-3 flex gap-2"><button className="btn" onClick={() => { decide(q.id, role, true, c[q.id] || ''); toast(q.id + ' approved') }}>Approve</button><button className="btn2" onClick={() => { decide(q.id, role, false, c[q.id] || ''); toast(q.id + ' rejected') }}>Reject</button></div>
        </div> })}</div>
    </Shell>)
}
