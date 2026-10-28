/** Discount approval queue. Admin sees mid-range discounts, CEO sees everything. */
'use client'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'
import {
  discountPercent,
  hasPriceBelowMinimum,
  quoteDiscountAmount,
  quoteListTotal,
  quoteSubtotal,
  quoteTotal,
} from '@/lib/pricing'

export default function Approvals() {
  const role = useParams().role as Role
  const { quotes, deals, products, decideApproval } = useStore()
  const [comments, setComments] = useState<Record<string, string>>({})
  const list = quotes.filter(
    (quote) => quote.status === 'Pending approval' && (role === 'ceo' || quote.need === 'admin'),
  )
  return (
    <Shell role={role}>
      <h1 className="mb-3 text-lg font-semibold">Approval queue</h1>
      {list.length === 0 && (
        <p className="box text-sm text-mute">Nothing waiting. New requests appear here.</p>
      )}
      <div className="grid gap-3">
        {list.map((quote) => {
          const d = deals.find((deal) => deal.id === quote.dealId)
          return (
            <div key={quote.id} className="box">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">
                  {quote.id} · {d?.company}
                </p>
                <p className="text-sm">
                  {discountPercent(quote).toFixed(1)}% off · ₹
                  {Math.round(quoteTotal(quote)).toLocaleString('en-IN')}
                </p>
              </div>
              <p className="mt-2 text-sm">
                <span className="text-mute line-through">
                  ₹{Math.round(quoteListTotal(quote)).toLocaleString('en-IN')}
                </span>{' '}
                → <b>₹{Math.round(quoteSubtotal(quote)).toLocaleString('en-IN')}</b>{' '}
                <span className="text-mute">
                  before GST · discount ₹
                  {Math.round(quoteDiscountAmount(quote)).toLocaleString('en-IN')}
                </span>
              </p>
              {hasPriceBelowMinimum(quote, products) && (
                <p className="mt-1 text-sm text-red-500">
                  Price below minimum:{' '}
                  {quote.items
                    .filter((item) => {
                      const min = products.find((product) => product.name === item.product)?.min
                      return min !== undefined && item.price < min
                    })
                    .map((item) => {
                      const min = products.find((product) => product.name === item.product)!.min
                      return `${item.product} ₹${Math.round(item.price).toLocaleString('en-IN')} (min ₹${Math.round(min).toLocaleString('en-IN')})`
                    })
                    .join(', ')}
                </p>
              )}
              <p className="mt-1 text-sm text-mute">Reason: {quote.reason}</p>
              <input
                className="inp mt-3"
                placeholder="Comment (optional)"
                value={comments[quote.id] || ''}
                onChange={(event) => setComments({ ...comments, [quote.id]: event.target.value })}
              />
              <div className="mt-3 flex gap-2">
                <button
                  className="btn"
                  onClick={() => {
                    decideApproval(quote.id, role, true, comments[quote.id] || '')
                    toast(quote.id + ' approved')
                  }}
                >
                  Approve
                </button>
                <button
                  className="btn2"
                  onClick={() => {
                    decideApproval(quote.id, role, false, comments[quote.id] || '')
                    toast(quote.id + ' rejected')
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
