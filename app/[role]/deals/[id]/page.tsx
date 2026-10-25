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
import Templates from '@/components/Templates'
import FollowUp from '@/components/FollowUp'
import RepLink from '@/components/RepLink'
import Num from '@/components/Num'
import { useStore, Role, Quote, STAGES, discountPct, needOf, total, lineAmt, arrOf, Billing, payPlan, origAmt, lineDiscPct, origTotal, subTotal, discAmt } from '@/lib/store'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const per = (b?: Billing) => (b === 'Monthly' ? '/mo' : b === 'Annual' ? '/yr' : '')
export default function Deal() {
  const { role: r, id } = useParams() as { role: Role; id: string }
  const { deals, quotes, addQuote, saveQuote, submit, setStatus, setStage, products, settings, markFinal, invoices, createInvoice, payments } = useStore()
  const meName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name)
  const d = deals.find((x) => x.id === id); const qs = quotes.filter((q) => q.dealId === id)
  const [sel, setSel] = useState<string | null>(null); const [reason, setReason] = useState('')
  const q = qs.find((x) => x.id === sel) || qs[0]
  const finalQ = qs.find((x) => x.final); const inv = finalQ && invoices.find((i) => i.quoteId === finalQ.id)
  const next = payments.filter((p) => p.dealId === id && p.status === 'Due').sort((a, b) => a.due.localeCompare(b.due))[0]
  if (!d) return <Shell role={r}><p>Deal not found.</p></Shell>
  const upd = (i: number, k: 'product' | 'qty' | 'price' | 'term' | 'disc', v: string) => { if (!q) return
    const items = q.items.map((it, n) => { if (n !== i) return it
      if (k === 'product') { const p = products.find((x) => x.name === v)!; return { ...it, product: v, list: p.list, price: p.list, billing: p.billing ?? 'One-time', term: (p.billing ?? 'One-time') === 'One-time' ? 1 : 12 } }
      if (k === 'disc') { const pct = Math.min(100, Math.max(0, Number(v) || 0)); return { ...it, price: Math.round(it.list * (1 - pct / 100) * 100) / 100 } }
      return { ...it, [k]: Math.max(0, Number(v) || 0) } })
    saveQuote({ ...q, items }) }
  const setBilling = (i: number, b: Billing) => { if (!q) return; saveQuote({ ...q, items: q.items.map((it, n) => (n === i ? { ...it, billing: b, term: b === 'One-time' ? 1 : it.term && it.term > 1 ? it.term : 12 } : it)) }) }
  const locked = !!q && q.status !== 'Draft' && q.status !== 'Rejected'
  const disc = q ? discountPct(q) : 0; const need = q ? needOf(q, settings, products) : 'auto'
  return (
    <Shell role={r}>
      <div className="box">
        <div className="flex flex-wrap justify-between gap-2"><div className="flex items-center gap-3"><Avatar name={d.company} size={40} /><h1 className="text-lg font-semibold">{d.company}</h1></div><span className="text-sm text-mute">{d.client} · GST {d.gst || '—'} · Owner: <RepLink name={d.rep} className="font-medium text-ink" /></span></div>
        <div className="mt-3 flex gap-1 overflow-x-auto">{STAGES.map((s, i) => { const closed = i === 4 && d.stage === 4; const col = closed ? (d.outcome === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-green-600 text-white') : i <= d.stage ? 'bg-brand text-white' : 'border border-line text-mute'
          return <button key={s} onClick={() => stageTo(d.id, i)} className={`whitespace-nowrap rounded-md px-3 py-1 text-xs ${col}`}>{closed ? (d.outcome === 'Cancelled' ? 'Cancelled' : 'Done · Won') : s}</button> })}</div>
        {d.outcome && <div className={`mt-3 rounded-lg border-l-4 p-3 text-sm ${d.outcome === 'Cancelled' ? 'border-red-500 bg-red-500/10' : 'border-green-600 bg-green-600/10'}`}><b>{d.outcome === 'Cancelled' ? 'Deal cancelled' : 'Deal done'}</b>{d.closedAt && <span className="text-mute"> · {d.closedAt}</span>}<p className="mt-1">{d.closeNote}</p></div>}
      </div>
      {finalQ && <div className="box mt-4 flex flex-wrap items-center justify-between gap-3 border-brand/50 bg-brand/5"><div><p className="text-xs text-mute">Final amount · {finalQ.id} v{finalQ.version}</p><p className="text-2xl font-semibold">₹{Math.round(total(finalQ)).toLocaleString('en-IN')}</p>{next && <p className="mt-1 text-xs text-mute">Next {next.kind.toLowerCase()} payment {next.n}/{next.of}: ₹{Math.round(next.amount).toLocaleString('en-IN')} due {next.due}</p>}</div>
        {inv ? <Link href={`/${r}/invoices/${inv.id}`} className="btn2">View invoice {inv.id}</Link> : r === 'admin' ? <button className="btn" onClick={() => { const id = createInvoice(finalQ.id, 'Admin'); toast(`Invoice ${id} created`) }}>Create invoice</button> : <span className="text-sm text-mute">Waiting for Admin to create the invoice</span>}</div>}
      <DealInfo dealId={d.id} />
      <FollowUp dealId={d.id} />
      <DealTabs dealId={d.id} who={meName ?? (r === 'rep' ? d.rep : r)} />
      <Templates dealId={d.id} who={meName ?? (r === 'rep' ? d.rep : r)} />
      <div className="mb-2 mt-6 flex items-center justify-between"><h2 className="font-medium">Quotations</h2><button className="btn" onClick={() => { setSel(addQuote(d.id)); toast('New quote created') }}>New quote</button></div>
      <div className="mb-3 flex gap-2 overflow-x-auto">{qs.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`btn2 whitespace-nowrap ${q?.id === x.id ? 'border-brand' : ''}`}>{x.id} v{x.version} · {x.status}</button>)}</div>
      {!q ? <p className="box text-sm text-mute">No quotes yet. Create the first one.</p> : (
        <div className="box">
          <div className="grid gap-4">{q.items.map((it, i) => { const lp = lineDiscPct(it); const min = products.find((x) => x.name === it.product)?.min; const rec = !!it.billing && it.billing !== 'One-time'
            const lab = 'grid gap-1 text-[11px] font-medium text-mute'
            return (
            <div key={it.id} className="rounded-3xl border border-line p-3">
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 md:grid-cols-12">
                <label className={`${lab} col-span-2 md:col-span-3`}>Product<select disabled={locked} className="inp" value={it.product} onChange={(e) => upd(i, 'product', e.target.value)}>{products.map((p) => <option key={p.id}>{p.name}</option>)}</select></label>
                <label className={`${lab} md:col-span-1`}>Qty<Num disabled={locked} className="inp" value={it.qty} onChange={(v) => upd(i, 'qty', v)} /></label>
                <div className={`${lab} md:col-span-2`}>Original price<p className="rounded-lg px-4 py-2 text-sm font-normal text-ink">{inr(it.list)}<span className="text-xs text-mute">{per(it.billing)}</span></p></div>
                <label className={`${lab} md:col-span-1`}>Discount %<Num disabled={locked} className="inp" min={0} max={100} step="0.5" value={lp} onChange={(v) => upd(i, 'disc', v)} /></label>
                <label className={`${lab} md:col-span-2`}>Final price{rec ? ' (each)' : ''}<Num disabled={locked} className="inp" min={0} value={it.price} onChange={(v) => upd(i, 'price', v)} /></label>
                <label className={`${lab} md:col-span-2`}>Billing<select disabled={locked} className="inp" value={it.billing ?? 'One-time'} onChange={(e) => setBilling(i, e.target.value as Billing)}><option value="One-time">One-time</option><option value="Monthly">Monthly</option><option value="Annual">Annual (ARR)</option></select></label>
                {rec ? <label className={`${lab} md:col-span-1`}>Months<Num disabled={locked} className="inp" min={1} value={it.term ?? 12} onChange={(v) => upd(i, 'term', v)} /></label> : <span className="hidden md:col-span-1 md:block" />}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
                <span>Line total {lp > 0 && <s className="mr-1">{inr(origAmt(it))}</s>}<b className="text-ink">{inr(lineAmt(it))}</b></span>
                {lp > 0 ? <span className="pill bg-green-500/15 text-green-600">{lp.toFixed(1)}% off · saves {inr(origAmt(it) - lineAmt(it))}</span> : it.price > it.list ? <span className="text-amber-600">Above original price</span> : <span>No discount</span>}
                {min && it.price < min ? <span className="text-red-500">Below minimum price {inr(min)}: needs CEO</span> : null}</p>
            </div>) })}</div>
          {q.items.some((i) => i.billing && i.billing !== 'One-time') && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm"><label className="flex items-center gap-2"><span className="text-mute">First payment date</span><input disabled={locked} type="date" className="inp w-auto" value={q.startDate ?? new Date().toISOString().slice(0, 10)} onChange={(e) => saveQuote({ ...q, startDate: e.target.value })} /></label>
            {(() => { const st = q.startDate ?? new Date().toISOString().slice(0, 10); const pl = payPlan(d.id, q.id, q.items, st); const nx = pl.filter((x) => x.due > st).sort((a, b) => a.due.localeCompare(b.due))[0]; return <span className="text-xs text-mute">{pl.length} payments · next after first: {nx ? nx.due : 'none'}</span> })()}</div>}
          <div className="mt-4 grid gap-4 border-t border-line pt-3 md:grid-cols-2">
            <p className="text-sm">Discount <b>{disc.toFixed(1)}%</b> · {need === 'auto' ? 'no approval needed' : need === 'admin' ? 'needs Admin or CEO' : 'needs CEO'}</p>
            <dl className="grid gap-1 text-sm md:ml-auto md:w-full md:max-w-xs">
              <div className="flex justify-between"><dt className="text-mute">Original price</dt><dd className={discAmt(q) > 0 ? 'text-mute line-through' : ''}>{inr(origTotal(q))}</dd></div>
              {discAmt(q) > 0 && <div className="flex justify-between"><dt className="text-mute">Discount ({disc.toFixed(1)}%)</dt><dd className="text-green-600">−{inr(discAmt(q))}</dd></div>}
              <div className="flex justify-between"><dt className="text-mute">Price after discount</dt><dd>{inr(subTotal(q))}</dd></div>
              <div className="flex justify-between"><dt className="text-mute">GST</dt><dd>{inr(total(q) - subTotal(q))}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{inr(total(q))}</dd></div></dl></div>
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
      {q && <div className="print-only p-8 text-black"><h1 className="plain text-2xl font-bold">Quotation {q.id} (v{q.version})</h1><p>{d.company} · {d.client} · GST {d.gst}</p><p>Valid until {q.expires}</p>
        <table className="mt-6 w-full text-left text-sm"><thead><tr><th>Item</th><th>Qty</th><th>Original price</th><th>Discount</th><th>Unit price</th><th className="text-right">Amount</th></tr></thead><tbody>{q.items.map((i) => <tr key={i.id}><td>{i.product}</td><td>{i.qty}</td><td>{inr(i.list)}</td><td>{lineDiscPct(i) > 0 ? lineDiscPct(i).toFixed(1) + '%' : '-'}</td><td>{inr(i.price)}</td><td className="text-right">{inr(lineAmt(i))}</td></tr>)}</tbody></table>
        <div className="ml-auto mt-4 w-64 text-sm"><p className="flex justify-between"><span>Original price</span><span>{inr(origTotal(q))}</span></p>{discAmt(q) > 0 && <p className="flex justify-between"><span>Discount ({disc.toFixed(1)}%)</span><span>-{inr(discAmt(q))}</span></p>}<p className="flex justify-between"><span>Price after discount</span><span>{inr(subTotal(q))}</span></p><p className="flex justify-between"><span>GST</span><span>{inr(total(q) - subTotal(q))}</span></p></div>
        <p className="text-right text-xl font-bold">Total {inr(total(q))}</p></div>}
    </Shell>)
}
