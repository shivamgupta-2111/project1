/** Builds the payment schedule that is created when a quote is marked final. */
import { Item, Payment } from '@/lib/types'
import { addMonths, uid } from '@/lib/utils'

/** Builds the payments created when a quote is marked final. Monthly lines bill every month for their term; annual lines bill once per year. Amounts include GST. */
export const buildPaymentSchedule = (
  dealId: string,
  quoteId: string,
  items: Item[],
  start: string,
): Payment[] => {
  const out: Payment[] = []
  const grossPerUnit = (item: Item) => item.price * item.qty * (1 + item.gst / 100)
  const mTerm = Math.max(
    0,
    ...items.filter((item) => item.billing === 'Monthly').map((item) => item.term ?? 12),
  )
  for (let k = 0; k < mTerm; k++)
    out.push({
      id: uid(),
      dealId,
      quoteId,
      kind: 'Monthly',
      n: k + 1,
      of: mTerm,
      due: addMonths(start, k),
      amount: items
        .filter((item) => item.billing === 'Monthly' && (item.term ?? 12) > k)
        .reduce((sum, item) => sum + grossPerUnit(item), 0),
      status: 'Due',
    })
  const yrs = Math.max(
    0,
    ...items
      .filter((item) => item.billing === 'Annual')
      .map((item) => Math.ceil((item.term ?? 12) / 12)),
  )
  for (let index = 0; index < yrs; index++)
    out.push({
      id: uid(),
      dealId,
      quoteId,
      kind: 'Annual',
      n: index + 1,
      of: yrs,
      due: addMonths(start, 12 * index),
      amount: items
        .filter((item) => item.billing === 'Annual' && Math.ceil((item.term ?? 12) / 12) > index)
        .reduce((sum, item) => sum + grossPerUnit(item), 0),
      status: 'Due',
    })
  return out
}
