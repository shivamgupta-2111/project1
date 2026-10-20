'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import Avatar from '@/components/Avatar'
import { toast } from '@/components/Toaster'
import { stageTo } from '@/components/CloseDialog'
import DealTabs from '@/components/DealTabs'
import DealInfo from '@/components/DealInfo'
import { useStore, Role, Quote, STAGES, discountPct, needOf, total, lineAmt, arrOf } from '@/lib/store'
export default function Deal() {
  const { role: r, id } = useParams() as { role: Role; id: string }
  const { deals, quotes, addQuote, saveQuote, submit, setStatus, setStage, products, settings, markFinal, invoices, createInvoice, payments } = useStore()
  const d = deals.find((x) => x.id === id); const qs = quotes.filter((q) => q.dealId === id)
  const [sel, setSel] = useState<string | null>(null); const [reason, setReason] = useState('')
  const q = qs.find((x) => x.id === sel) || qs[0]
  const finalQ = qs.find((x) => x.final); const inv = finalQ && invoices.find((i) => i.quoteId === finalQ.id)
  const next = payments.filter((p) => p.dealId === id && p.status === 'Due').sort((a, b) => a.due.localeCompare(b.due))[0]
  if (!d) return <Shell role={r}><p>Deal not found.</p></Shell>
  const upd = (i: number, k: 'product' | 'qty' | 'price' | 'term', v: string) => { if (!q) return
    const items = q.items.map((it, n) => { if (n !== i) return it
      if (k === 'product') { const p = products.find((x) => x.name === v)!; return { ...it, product: v, list: p.list, price: p.list, billing: p.billing ?? 'One-time', term: (p.billing ?? 'One-time') === 'One-time' ? 1 : 12 } }
      return { ...it, [k]: Math.max(0, Number(v) || 0) } })
    saveQuote({ ...q, items }) }
  const locked = !!q && q.status !== 'Draft' && q.status !== 'Rejected'
  const disc = q ? discountPct(q) : 0; const need = q ? needOf(q, settings, products) : 'auto'
  return (
    <Shell role={r}>
      <div className="box">
        <div className="flex flex-wrap justify-between gap-2"><div className="flex items-center gap-3"><Avatar name={d.company} size={40} /><h1 className="text-lg font-semibold">{d.company}</h1></div><span className="text-sm text-mute">{d.client} · GST {d.gst}</span></div>
        <div className="mt-3 flex gap-1 overflow-x-auto">{STAGES.map((s, i) => { const closed = i === 4 && d.stage === 4; const col = closed ? (d.outcome === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-green-600 text-white') : i <= d.stage ? 'bg-brand text-white' : 'border border-line text-mute'
          return <button key={s} onClick={() => stageTo(d.id, i)} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${col}`}>{closed ? (d.outcome === 'Cancelled' ? 'Cancelled' : 'Done · Won') : s}</button> })}</div>
        {d.outcome && <div className={`mt-3 rounded-full border-l-4 p-3 text-sm ${d.outcome === 'Cancelled' ? 'border-red-500 bg-red-500/10' : 'border-green-600 bg-green-600/10'}`}><b>{d.outcome === 'Cancelled' ? 'Deal cancelled' : 'Deal done'}</b>{d.closedAt && <span className="text-mute"> · {d.closedAt}</span>}<p className="mt-1">{d.closeNote}</p></div>}
      </div>
      {finalQ && <div className="box mt-4 flex flex-wrap items-center justify-between gap-3 border-brand/50 bg-brand/5"><div><p className="text-xs text-mute">Final amount · {finalQ.id} v{finalQ.version}</p><p className="text-2xl font-semibold">₹{Math.round(total(finalQ)).toLocaleString('en-IN')}</p>{next && <p className="mt-1 text-xs text-mute">Next {next.kind.toLowerCase()} payment {next.n}/{next.of}: ₹{Math.round(next.amount).toLocaleString('en-IN')} due {next.due}</p>}</div>
        {inv ? <Link href={`/${r}/invoices/${inv.id}`} className="btn2">View invoice {inv.id}</Link> : r === 'admin' ? <button className="btn" onClick={() => { const id = createInvoice(finalQ.id, 'Admin'); toast(`Invoice ${id} created`) }}>Create invoice</button> : <span className="text-sm text-mute">Waiting for Admin to create the invoice</span>}</div>}
      <DealInfo dealId={d.id} />
      <DealTabs dealId={d.id} who={r === 'rep' ? d.rep : r} />
      <div className="mb-2 mt-6 flex items-center justify-between"><h2 className="font-medium">Quotations</h2><button className="btn" onClick={() => { setSel(addQuote(d.id)); toast('New quote created') }}>New quote</button></div>
      <div className="mb-3 flex gap-2 overflow-x-auto">{qs.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`btn2 whitespace-nowrap ${q?.id === x.id ? 'border-brand' : ''}`}>{x.id} v{x.version} · {x.status}</button>)}</div>
      {!q ? <p className="box text-sm text-mute">No quotes yet. Create the first one.</p> : (
        <div className="box">
          <div className="grid gap-3">{q.items.map((it, i) => (
            <div key={it.id} className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <select disabled={locked} className="inp col-span-2" value={it.product} onChange={(e) => upd(i, 'product', e.target.value)}>{products.map((p) => <option key={p.id}>{p.name}</option>)}</select>
              <input disabled={locked} type="number" className="inp" value={it.qty} onChange={(e) => upd(i, 'qty', e.target.value)} aria-label="Quantity" />
              <input disabled={locked} type="number" className="inp" value={it.price} onChange={(e) => upd(i, 'price', e.target.value)} aria-label="Unit price" />
              {it.billing && it.billing !== 'One-time' ? <input disabled={locked} type="number" className="inp" value={it.term ?? 12} onChange={(e) => upd(i, 'term', e.target.value)} aria-label="Term in months" title="Term in months" /> : <span className="self-center text-xs text-mute">One-time</span>}
              <p className="col-span-2 self-center text-xs text-mute md:col-span-1">List ₹{it.list}{it.billing === 'Monthly' ? '/mo' : it.billing === 'Annual' ? '/yr' : ''}{(() => { const m = products.find((x) => x.name === it.product)?.min; return m && it.price < m ? <span className="text-red-500"> · below min ₹{m}</span> : null })()}</p></div>))}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <p className="text-sm">Discount <b>{disc.toFixed(1)}%</b> · {need === 'auto' ? 'no approval needed' : need === 'admin' ? 'needs Admin or CEO' : 'needs CEO'}</p>
            <p className="font-semibold">₹{Math.round(total(q)).toLocaleString('en-IN')} <span className="text-xs font-normal text-mute">incl. GST</span></p></div>
          {arrOf(q) > 0 && <p className="mt-2 text-sm text-mute">Recurring revenue: <b className="text-ink">ARR ₹{Math.round(arrOf(q)).toLocaleString('en-IN')}</b> · MRR ₹{Math.round(arrOf(q) / 12).toLocaleString('en-IN')} <span className="text-xs">(term is in months)</span></p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {!locked && <>{need !== 'auto' && <input className="inp md:w-72" placeholder="Reason for discount" value={reason} onChange={(e) => setReason(e.target.value)} />}
              <button className="btn" disabled={need !== 'auto' && !reason.trim()} onClick={() => { submit(q.id, reason); setReason(''); toast(need === 'auto' ? 'Quote finalized' : 'Approval requested. Admin/CEO notified.') }}>{need === 'auto' ? 'Finalize quote' : 'Request approval'}</button></>}
            {q.status === 'Approved' && <button className="btn" onClick={() => setStatus(q.id, 'Sent')}>Mark sent</button>}
            {(q.status === 'Approved' || q.status === 'Sent') && <button className="btn" onClick={() => { markFinal(q.id); toast('Marked final. Deal amount updated.') }}>Mark as final</button>}
            {q.status === 'Pending approval' && <p className="text-sm text-mute">Waiting for {q.need === 'ceo' ? 'CEO' : 'Admin or CEO'}.</p>}
            <button className="btn2" onClick={() => { setSel(addQuote(d.id, q as Quote)); toast('Quote duplicated') }}>Duplicate</button><button className="btn2" onClick={() => window.print()}>Print / PDF</button></div>
          <details className="mt-4 text-sm"><summary className="cursor-pointer text-mute">History</summary><ul className="mt-2 list-disc pl-5">{q.log.map((l, i) => <li key={i}>{l}</li>)}</ul></details>
        </div>)}
      {q && <div className="print-only p-8 text-black"><h1 className="text-2xl font-bold">Quotation {q.id} (v{q.version})</h1><p>{d.company} · {d.client} · GST {d.gst}</p><p>Valid until {q.expires}</p>
        <table className="mt-6 w-full text-left text-sm"><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{q.items.map((i) => <tr key={i.id}><td>{i.product}</td><td>{i.qty}</td><td>₹{i.price}</td><td>₹{Math.round(lineAmt(i))}</td></tr>)}</tbody></table>
        <p className="mt-4 text-right text-sm">GST 18% included in total</p><p className="text-right text-xl font-bold">Total ₹{Math.round(total(q)).toLocaleString('en-IN')}</p></div>}
    </Shell>)
}
