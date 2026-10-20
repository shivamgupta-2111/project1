'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { downloadInvoicePdf } from '@/lib/invoicePdf'
import { useStore, Role, total } from '@/lib/store'
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export default function Invoices() {
  const role = useParams().role as Role; const { invoices, deals, quotes, createInvoice, setInvoicePaid } = useStore(); const myName = useStore((s) => s.users.find((u) => u.id === s.meId)?.name)
  const visible = (dealId: string) => role !== 'rep' || deals.find((d) => d.id === dealId)?.rep === myName
  const list = invoices.filter((i) => visible(i.dealId)); const ready = role === 'admin' ? quotes.filter((q) => q.final && !invoices.some((i) => i.quoteId === q.id)) : []
  const co = (id: string) => deals.find((d) => d.id === id)?.company
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Invoices</h1><p className="mb-6 text-sm text-mute">Created from the final quotation of a deal.</p>
      {ready.length > 0 && <div className="box mb-4 border-brand/50 bg-brand/5"><p className="mb-3 font-medium">Ready to invoice</p><ul className="grid gap-2">{ready.map((q) => <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span><b>{co(q.dealId)}</b> · {q.id} · {inr(total(q))}</span><button className="btn" onClick={() => toast(`Invoice ${createInvoice(q.id, 'Admin')} created`)}>Create invoice</button></li>)}</ul></div>}
      <div className="box"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
        <thead className="text-xs text-mute"><tr><th className="pb-2 font-medium">Invoice</th><th className="font-medium">Company</th><th className="font-medium">Amount</th><th className="font-medium">Due</th><th className="font-medium">Status</th><th /></tr></thead>
        <tbody>{list.map((i) => <tr key={i.id} className="border-t border-line"><td className="py-3"><Link className="font-medium hover:text-brand" href={`/${role}/invoices/${i.id}`}>{i.id}</Link></td><td>{co(i.dealId)}</td><td>{inr(i.amount)}</td><td className="text-mute">{i.due}</td>
          <td><span className={`pill ${i.status === 'Paid' ? 'bg-green-500/15 text-green-600' : 'bg-amber-500/15 text-amber-600'}`}>{i.status}</span></td>
          <td><div className="flex justify-end gap-2"><Link href={`/${role}/invoices/${i.id}`} className="btn2 py-1 text-xs">View</Link>
            <button className="btn2 py-1 text-xs" onClick={() => { const q = quotes.find((x) => x.id === i.quoteId); const d = deals.find((x) => x.id === i.dealId); if (q && d) { downloadInvoicePdf(i, q, d); toast(`${i.id}.pdf downloaded`) } }}>PDF</button>
            {role === 'admin' && <button className="btn2 py-1 text-xs" onClick={() => setInvoicePaid(i.id, i.status !== 'Paid')}>{i.status === 'Paid' ? 'Mark unpaid' : 'Mark paid'}</button>}</div></td></tr>)}</tbody></table>
        {list.length === 0 && <p className="py-6 text-center text-sm text-mute">No invoices yet. Mark a quotation as final, then Admin creates the invoice.</p>}</div></div>
    </Shell>)
}
