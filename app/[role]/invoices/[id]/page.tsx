'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import { downloadInvoicePdf } from '@/lib/invoicePdf'
import { useStore, Role, lineAmt, lineDiscPct, origAmt } from '@/lib/store'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export default function InvoicePage() {
  const { role: r, id } = useParams() as { role: Role; id: string }; const { invoices, quotes, deals, setInvoicePaid } = useStore()
  const inv = invoices.find((i) => i.id === id); const q = inv && quotes.find((x) => x.id === inv.quoteId); const d = inv && deals.find((x) => x.id === inv.dealId)
  if (!inv || !q || !d) return <Shell role={r}><p className="box text-sm text-mute">Invoice not found.</p></Shell>
  const orig = q.items.reduce((t, i) => t + origAmt(i), 0)
  return (
    <Shell role={r}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><Link href={`/${r}/invoices`} className="text-sm text-mute hover:text-brand">← Invoices</Link>
        <div className="flex gap-2">{r === 'admin' && <button className="btn2" onClick={() => setInvoicePaid(inv.id, inv.status !== 'Paid')}>{inv.status === 'Paid' ? 'Mark unpaid' : 'Mark paid'}</button>}<button className="btn2" onClick={() => window.print()}>Print</button><button className="btn" onClick={() => downloadInvoicePdf(inv, q, d)}>Download PDF</button></div></div>
      <div className="print-area rounded-2xl border border-line bg-white p-6 text-[#1a1a2e] shadow-sm md:p-10">
        <div className="flex flex-wrap justify-between gap-4"><div><p className="flex items-center gap-2 text-xl font-semibold"><span className="grid h-8 w-8 place-items-center rounded-2xl bg-[#2563eb] text-white">P</span>Pipeline CRM</p><p className="mt-1 text-sm text-[#6e6e73]">Sales and quotations</p></div>
          <div className="text-right"><p className="text-2xl font-bold">INVOICE</p><p className="text-sm">{inv.id}</p><p className="text-sm text-[#6e6e73]">Date {inv.date} · Due {inv.due}</p>
            <p className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</p></div></div>
        <div className="mt-8 text-sm"><p className="text-xs text-[#6e6e73]">Bill to</p><p className="font-semibold">{d.company}</p><p>{d.client}</p><p>GST {d.gst || '—'}</p><p className="mt-1 text-xs text-[#6e6e73]">Based on quotation {q.id} (final)</p></div>
        <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-[#e8e8e6] text-xs text-[#6e6e73]"><tr><th className="py-2">Item</th><th>Qty</th><th>Original price</th><th>Discount</th><th>Unit price</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{q.items.map((i) => <tr key={i.id} className="border-b border-[#f0f0ee]"><td className="py-2">{i.product}{i.billing && i.billing !== 'One-time' && <span className="block text-xs text-[#6e6e73]">{i.billing} subscription · {i.term ?? 12} months</span>}</td><td>{i.qty}</td><td>{lineDiscPct(i) > 0 ? <s className="text-[#6e6e73]">{inr(i.list)}</s> : inr(i.list)}</td><td>{lineDiscPct(i) > 0 ? <span className="text-green-700">{lineDiscPct(i).toFixed(1)}%</span> : '—'}</td><td>{inr(i.price)}</td><td className="text-right">{inr(lineAmt(i))}</td></tr>)}</tbody></table></div>
        <div className="ml-auto mt-4 w-full max-w-xs text-sm">{orig > inv.subtotal + 0.5 && <><p className="flex justify-between py-1"><span>Original price</span><span className="text-[#6e6e73] line-through">{inr(orig)}</span></p><p className="flex justify-between py-1"><span>Discount ({((1 - inv.subtotal / orig) * 100).toFixed(1)}%)</span><span className="text-green-700">−{inr(orig - inv.subtotal)}</span></p></>}<p className="flex justify-between py-1"><span>{orig > inv.subtotal + 0.5 ? 'Price after discount' : 'Subtotal'}</span><span>{inr(inv.subtotal)}</span></p><p className="flex justify-between py-1"><span>GST (18%)</span><span>{inr(inv.gst)}</span></p>
          <p className="mt-1 flex justify-between border-t border-[#1a1a2e] pt-2 text-lg font-bold"><span>Total</span><span>{inr(inv.amount)}</span></p></div>
        <p className="mt-8 text-xs text-[#6e6e73]">Created by {inv.by}. Thank you for your business.</p>
      </div>
    </Shell>)
}
