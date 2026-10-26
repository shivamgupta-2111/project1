/** List of invoices. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { downloadInvoicePdf } from '@/lib/invoicePdf'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'
import { quoteTotal } from '@/lib/pricing'
import { formatINR } from '@/lib/format'

export default function Invoices() {
  const role = useParams().role as Role
  const { invoices, deals, quotes, createInvoice, setInvoicePaid } = useStore()
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const visible = (dealId: string) =>
    role !== 'rep' || deals.find((deal) => deal.id === dealId)?.rep === myName
  const list = invoices.filter((invoice) => visible(invoice.dealId))
  const ready =
    role === 'admin'
      ? quotes.filter(
          (quote) => quote.final && !invoices.some((invoice) => invoice.quoteId === quote.id),
        )
      : []
  const co = (id: string) => deals.find((deal) => deal.id === id)?.company
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <p className="mb-6 text-sm text-mute">Created from the final quotation of a deal.</p>
      {ready.length > 0 && (
        <div className="box mb-4 border-brand/50 bg-brand/5">
          <p className="mb-3 font-medium">Ready to invoice</p>
          <ul className="grid gap-2">
            {ready.map((quote) => (
              <li
                key={quote.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  <b>{co(quote.dealId)}</b> · {quote.id} · {formatINR(quoteTotal(quote))}
                </span>
                <button
                  className="btn"
                  onClick={() => toast(`Invoice ${createInvoice(quote.id, 'Admin')} created`)}
                >
                  Create invoice
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="box">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs text-mute">
              <tr>
                <th className="pb-2 font-medium">Invoice</th>
                <th className="font-medium">Company</th>
                <th className="font-medium">Amount</th>
                <th className="font-medium">Due</th>
                <th className="font-medium">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((invoice) => (
                <tr key={invoice.id} className="border-t border-line">
                  <td className="py-3">
                    <Link
                      className="font-medium hover:text-brand"
                      href={`/${role}/invoices/${invoice.id}`}
                    >
                      {invoice.id}
                    </Link>
                  </td>
                  <td>{co(invoice.dealId)}</td>
                  <td>{formatINR(invoice.amount)}</td>
                  <td className="text-mute">{invoice.due}</td>
                  <td>
                    <span
                      className={`pill ${invoice.status === 'Paid' ? 'bg-green-500/15 text-green-600' : 'bg-amber-500/15 text-amber-600'}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link href={`/${role}/invoices/${invoice.id}`} className="btn2 py-1 text-xs">
                        View
                      </Link>
                      <button
                        className="btn2 py-1 text-xs"
                        onClick={() => {
                          const q = quotes.find((quote) => quote.id === invoice.quoteId)
                          const d = deals.find((deal) => deal.id === invoice.dealId)
                          if (q && d) {
                            downloadInvoicePdf(invoice, q, d)
                            toast(`${invoice.id}.pdf downloaded`)
                          }
                        }}
                      >
                        PDF
                      </button>
                      {role === 'admin' && (
                        <button
                          className="btn2 py-1 text-xs"
                          onClick={() => setInvoicePaid(invoice.id, invoice.status !== 'Paid')}
                        >
                          {invoice.status === 'Paid' ? 'Mark unpaid' : 'Mark paid'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-mute">
              No invoices yet. Mark a quotation as final, then Admin creates the invoice.
            </p>
          )}
        </div>
      </div>
    </Shell>
  )
}
