/** Deal detail: stage bar, owner, quotes with approval flow, invoices, follow-ups and the call log. */
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
import { useStore } from '@/lib/store'
import { Billing, Quote, Role } from '@/lib/types'
import { STAGES } from '@/lib/constants'
import {
  annualRecurringRevenue,
  approverForQuote,
  discountPercent,
  lineDiscountPercent,
  lineListAmount,
  lineTotal,
  quoteDiscountAmount,
  quoteListTotal,
  quoteSubtotal,
  quoteTotal,
} from '@/lib/pricing'
import { buildPaymentSchedule } from '@/lib/payments'
import { formatINR } from '@/lib/format'

const per = (b?: Billing) => (b === 'Monthly' ? '/mo' : b === 'Annual' ? '/yr' : '')
export default function Deal() {
  const { role: r, id } = useParams() as { role: Role; id: string }
  const {
    deals,
    quotes,
    addQuote,
    saveQuote,
    submitForApproval,
    setQuoteStatus,
    setDealStage,
    products,
    settings,
    markQuoteFinal,
    invoices,
    createInvoice,
    payments,
  } = useStore()
  const meName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const d = deals.find((deal) => deal.id === id)
  const qs = quotes.filter((quote) => quote.dealId === id)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const q = qs.find((quote) => quote.id === selectedQuoteId) || qs[0]
  const finalQ = qs.find((quote) => quote.final)
  const inv = finalQ && invoices.find((invoice) => invoice.quoteId === finalQ.id)
  const next = payments
    .filter((payment) => payment.dealId === id && payment.status === 'Due')
    .sort((a, payment) => a.due.localeCompare(payment.due))[0]
  if (!d)
    return (
      <Shell role={r}>
        <p>Deal not found.</p>
      </Shell>
    )
  const upd = (i: number, k: 'product' | 'qty' | 'price' | 'term' | 'disc', v: string) => {
    if (!q) return
    const items = q.items.map((item, n) => {
      if (n !== i) return item
      if (k === 'product') {
        const p = products.find((product) => product.name === v)!
        return {
          ...item,
          product: v,
          list: p.list,
          price: p.list,
          billing: p.billing ?? 'One-time',
          term: (p.billing ?? 'One-time') === 'One-time' ? 1 : 12,
        }
      }
      if (k === 'disc') {
        const pct = Math.min(100, Math.max(0, Number(v) || 0))
        return { ...item, price: Math.round(item.list * (1 - pct / 100) * 100) / 100 }
      }
      return { ...item, [k]: Math.max(0, Number(v) || 0) }
    })
    saveQuote({ ...q, items })
  }
  const setBilling = (i: number, b: Billing) => {
    if (!q) return
    saveQuote({
      ...q,
      items: q.items.map((item, n) =>
        n === i
          ? {
              ...item,
              billing: b,
              term: b === 'One-time' ? 1 : item.term && item.term > 1 ? item.term : 12,
            }
          : item,
      ),
    })
  }
  const locked = !!q && q.status !== 'Draft' && q.status !== 'Rejected'
  const disc = q ? discountPercent(q) : 0
  const need = q ? approverForQuote(q, settings, products) : 'auto'
  return (
    <Shell role={r}>
      <div className="box">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar name={d.company} size={40} />
            <h1 className="text-lg font-semibold">{d.company}</h1>
          </div>
          <span className="text-sm text-mute">
            {d.client} · GST {d.gst || '—'} · Owner:{' '}
            <RepLink name={d.rep} className="font-medium text-ink" />
          </span>
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {STAGES.map((stage, index) => {
            const closed = index === 4 && d.stage === 4
            const col = closed
              ? d.outcome === 'Cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-green-600 text-white'
              : index <= d.stage
                ? 'bg-brand text-white'
                : 'border border-line text-mute'
            return (
              <button
                key={stage}
                onClick={() => stageTo(d.id, index)}
                className={`whitespace-nowrap rounded-md px-3 py-1 text-xs ${col}`}
              >
                {closed ? (d.outcome === 'Cancelled' ? 'Cancelled' : 'Done · Won') : stage}
              </button>
            )
          })}
        </div>
        {d.outcome && (
          <div
            className={`mt-3 rounded-lg border-l-4 p-3 text-sm ${d.outcome === 'Cancelled' ? 'border-red-500 bg-red-500/10' : 'border-green-600 bg-green-600/10'}`}
          >
            <b>{d.outcome === 'Cancelled' ? 'Deal cancelled' : 'Deal done'}</b>
            {d.closedAt && <span className="text-mute"> · {d.closedAt}</span>}
            <p className="mt-1">{d.closeNote}</p>
          </div>
        )}
      </div>
      {finalQ && (
        <div className="box mt-4 flex flex-wrap items-center justify-between gap-3 border-brand/50 bg-brand/5">
          <div>
            <p className="text-xs text-mute">
              Final amount · {finalQ.id} v{finalQ.version}
            </p>
            <p className="text-2xl font-semibold">
              ₹{Math.round(quoteTotal(finalQ)).toLocaleString('en-IN')}
            </p>
            {next && (
              <p className="mt-1 text-xs text-mute">
                Next {next.kind.toLowerCase()} payment {next.n}/{next.of}: ₹
                {Math.round(next.amount).toLocaleString('en-IN')} due {next.due}
              </p>
            )}
          </div>
          {inv ? (
            <Link href={`/${r}/invoices/${inv.id}`} className="btn2">
              View invoice {inv.id}
            </Link>
          ) : r === 'admin' ? (
            <button
              className="btn"
              onClick={() => {
                const id = createInvoice(finalQ.id, 'Admin')
                toast(`Invoice ${id} created`)
              }}
            >
              Create invoice
            </button>
          ) : (
            <span className="text-sm text-mute">Waiting for Admin to create the invoice</span>
          )}
        </div>
      )}
      <DealInfo dealId={d.id} />
      <FollowUp dealId={d.id} />
      <DealTabs dealId={d.id} who={meName ?? (r === 'rep' ? d.rep : r)} />
      <Templates dealId={d.id} who={meName ?? (r === 'rep' ? d.rep : r)} />
      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="font-medium">Quotations</h2>
        <button
          className="btn"
          onClick={() => {
            setSelectedQuoteId(addQuote(d.id))
            toast('New quote created')
          }}
        >
          New quote
        </button>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {qs.map((quote) => (
          <button
            key={quote.id}
            onClick={() => setSelectedQuoteId(quote.id)}
            className={`btn2 whitespace-nowrap ${q?.id === quote.id ? 'border-brand' : ''}`}
          >
            {quote.id} v{quote.version} · {quote.status}
          </button>
        ))}
      </div>
      {!q ? (
        <p className="box text-sm text-mute">No quotes yet. Create the first one.</p>
      ) : (
        <div className="box">
          <div className="grid gap-4">
            {q.items.map((item, index) => {
              const lp = lineDiscountPercent(item)
              const min = products.find((product) => product.name === item.product)?.min
              const rec = !!item.billing && item.billing !== 'One-time'
              const lab = 'grid gap-1 text-[11px] font-medium text-mute'
              return (
                <div key={item.id} className="rounded-3xl border border-line p-3">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 md:grid-cols-12">
                    <label className={`${lab} col-span-2 md:col-span-3`}>
                      Product
                      <select
                        disabled={locked}
                        className="inp"
                        value={item.product}
                        onChange={(event) => upd(index, 'product', event.target.value)}
                      >
                        {products.map((product) => (
                          <option key={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={`${lab} md:col-span-1`}>
                      Qty
                      <Num
                        disabled={locked}
                        className="inp"
                        value={item.qty}
                        onChange={(v) => upd(index, 'qty', v)}
                      />
                    </label>
                    <div className={`${lab} md:col-span-2`}>
                      Original price
                      <p className="rounded-lg px-4 py-2 text-sm font-normal text-ink">
                        {formatINR(item.list)}
                        <span className="text-xs text-mute">{per(item.billing)}</span>
                      </p>
                    </div>
                    <label className={`${lab} md:col-span-1`}>
                      Discount %
                      <Num
                        disabled={locked}
                        className="inp"
                        min={0}
                        max={100}
                        step="0.5"
                        value={lp}
                        onChange={(v) => upd(index, 'disc', v)}
                      />
                    </label>
                    <label className={`${lab} md:col-span-2`}>
                      Final price{rec ? ' (each)' : ''}
                      <Num
                        disabled={locked}
                        className="inp"
                        min={0}
                        value={item.price}
                        onChange={(v) => upd(index, 'price', v)}
                      />
                    </label>
                    <label className={`${lab} md:col-span-2`}>
                      Billing
                      <select
                        disabled={locked}
                        className="inp"
                        value={item.billing ?? 'One-time'}
                        onChange={(event) => setBilling(index, event.target.value as Billing)}
                      >
                        <option value="One-time">One-time</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual (ARR)</option>
                      </select>
                    </label>
                    {rec ? (
                      <label className={`${lab} md:col-span-1`}>
                        Months
                        <Num
                          disabled={locked}
                          className="inp"
                          min={1}
                          value={item.term ?? 12}
                          onChange={(v) => upd(index, 'term', v)}
                        />
                      </label>
                    ) : (
                      <span className="hidden md:col-span-1 md:block" />
                    )}
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
                    <span>
                      Line total{' '}
                      {lp > 0 && <s className="mr-1">{formatINR(lineListAmount(item))}</s>}
                      <b className="text-ink">{formatINR(lineTotal(item))}</b>
                    </span>
                    {lp > 0 ? (
                      <span className="pill bg-green-500/15 text-green-600">
                        {lp.toFixed(1)}% off · saves{' '}
                        {formatINR(lineListAmount(item) - lineTotal(item))}
                      </span>
                    ) : item.price > item.list ? (
                      <span className="text-amber-600">Above original price</span>
                    ) : (
                      <span>No discount</span>
                    )}
                    {min && item.price < min ? (
                      <span className="text-red-500">
                        Below minimum price {formatINR(min)}: needs CEO
                      </span>
                    ) : null}
                  </p>
                </div>
              )
            })}
          </div>
          {q.items.some((item) => item.billing && item.billing !== 'One-time') && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-mute">First payment date</span>
                <input
                  disabled={locked}
                  type="date"
                  className="inp w-auto"
                  value={q.startDate ?? new Date().toISOString().slice(0, 10)}
                  onChange={(event) => saveQuote({ ...q, startDate: event.target.value })}
                />
              </label>
              {(() => {
                const st = q.startDate ?? new Date().toISOString().slice(0, 10)
                const payments = buildPaymentSchedule(d.id, q.id, q.items, st)
                const nx = payments
                  .filter((payment) => payment.due > st)
                  .sort((a, payment) => a.due.localeCompare(payment.due))[0]
                return (
                  <span className="text-xs text-mute">
                    {payments.length} payments · next after first: {nx ? nx.due : 'none'}
                  </span>
                )
              })()}
            </div>
          )}
          <div className="mt-4 grid gap-4 border-t border-line pt-3 md:grid-cols-2">
            <p className="text-sm">
              Discount <b>{disc.toFixed(1)}%</b> ·{' '}
              {need === 'auto'
                ? 'no approval needed'
                : need === 'admin'
                  ? 'needs Admin or CEO'
                  : 'needs CEO'}
            </p>
            <dl className="grid gap-1 text-sm md:ml-auto md:w-full md:max-w-xs">
              <div className="flex justify-between">
                <dt className="text-mute">Original price</dt>
                <dd className={quoteDiscountAmount(q) > 0 ? 'text-mute line-through' : ''}>
                  {formatINR(quoteListTotal(q))}
                </dd>
              </div>
              {quoteDiscountAmount(q) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-mute">Discount ({disc.toFixed(1)}%)</dt>
                  <dd className="text-green-600">−{formatINR(quoteDiscountAmount(q))}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-mute">Price after discount</dt>
                <dd>{formatINR(quoteSubtotal(q))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mute">GST</dt>
                <dd>{formatINR(quoteTotal(q) - quoteSubtotal(q))}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(quoteTotal(q))}</dd>
              </div>
            </dl>
          </div>
          {annualRecurringRevenue(q) > 0 && (
            <p className="mt-2 text-sm text-mute">
              Recurring revenue:{' '}
              <b className="text-ink">
                ARR ₹{Math.round(annualRecurringRevenue(q)).toLocaleString('en-IN')}
              </b>{' '}
              · MRR ₹{Math.round(annualRecurringRevenue(q) / 12).toLocaleString('en-IN')}{' '}
              <span className="text-xs">(term is in months)</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!locked && (
              <>
                {need !== 'auto' && (
                  <input
                    className="inp md:w-72"
                    placeholder="Reason for discount"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                )}
                <button
                  className="btn"
                  disabled={need !== 'auto' && !reason.trim()}
                  onClick={() => {
                    submitForApproval(q.id, reason)
                    setReason('')
                    toast(
                      need === 'auto'
                        ? 'Quote finalized'
                        : 'Approval requested. Admin/CEO notified.',
                    )
                  }}
                >
                  {need === 'auto' ? 'Finalize quote' : 'Request approval'}
                </button>
              </>
            )}
            {q.status === 'Approved' && (
              <button className="btn" onClick={() => setQuoteStatus(q.id, 'Sent')}>
                Mark sent
              </button>
            )}
            {(q.status === 'Approved' || q.status === 'Sent') && (
              <button
                className="btn"
                onClick={() => {
                  markQuoteFinal(q.id)
                  toast('Marked final. Deal amount updated.')
                }}
              >
                Mark as final
              </button>
            )}
            {q.status === 'Pending approval' && (
              <p className="text-sm text-mute">
                Waiting for {q.need === 'ceo' ? 'CEO' : 'Admin or CEO'}.
              </p>
            )}
            <button
              className="btn2"
              onClick={() => {
                setSelectedQuoteId(addQuote(d.id, q as Quote))
                toast('Quote duplicated')
              }}
            >
              Duplicate
            </button>
            <button className="btn2" onClick={() => window.print()}>
              Print / PDF
            </button>
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-mute">History</summary>
            <ul className="mt-2 list-disc pl-5">
              {q.log.map((l, index) => (
                <li key={index}>{l}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
      {q && (
        <div className="print-only p-8 text-black">
          <h1 className="plain text-2xl font-bold">
            Quotation {q.id} (v{q.version})
          </h1>
          <p>
            {d.company} · {d.client} · GST {d.gst}
          </p>
          <p>Valid until {q.expires}</p>
          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Original price</th>
                <th>Discount</th>
                <th>Unit price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product}</td>
                  <td>{item.qty}</td>
                  <td>{formatINR(item.list)}</td>
                  <td>
                    {lineDiscountPercent(item) > 0
                      ? lineDiscountPercent(item).toFixed(1) + '%'
                      : '-'}
                  </td>
                  <td>{formatINR(item.price)}</td>
                  <td className="text-right">{formatINR(lineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto mt-4 w-64 text-sm">
            <p className="flex justify-between">
              <span>Original price</span>
              <span>{formatINR(quoteListTotal(q))}</span>
            </p>
            {quoteDiscountAmount(q) > 0 && (
              <p className="flex justify-between">
                <span>Discount ({disc.toFixed(1)}%)</span>
                <span>-{formatINR(quoteDiscountAmount(q))}</span>
              </p>
            )}
            <p className="flex justify-between">
              <span>Price after discount</span>
              <span>{formatINR(quoteSubtotal(q))}</span>
            </p>
            <p className="flex justify-between">
              <span>GST</span>
              <span>{formatINR(quoteTotal(q) - quoteSubtotal(q))}</span>
            </p>
          </div>
          <p className="text-right text-xl font-bold">Total {formatINR(quoteTotal(q))}</p>
        </div>
      )}
    </Shell>
  )
}
