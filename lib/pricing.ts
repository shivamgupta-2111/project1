/** Quote maths: line totals, discounts, GST and which role must approve a quote. */
import { Item, Product, Quote, Settings, Billing } from '@/lib/types'

/** How many times a line's price is charged over its term: monthly lines bill every month, annual lines once a year, one-time lines once. */
export const billingMultiplier = (item: Item) =>
  item.billing === 'Monthly'
    ? (item.term ?? 12)
    : item.billing === 'Annual'
      ? (item.term ?? 12) / 12
      : 1

/** What the client pays for one line over its whole term, before GST. */
export const lineTotal = (item: Item) => item.price * item.qty * billingMultiplier(item)

/** Yearly recurring revenue of a quote: monthly lines x 12 plus annual lines. One-time lines don't count. */
export const annualRecurringRevenue = (quote: Quote) =>
  quote.items.reduce(
    (sum, item) =>
      sum +
      (item.billing === 'Monthly'
        ? item.price * item.qty * 12
        : item.billing === 'Annual'
          ? item.price * item.qty
          : 0),
    0,
  )

/** Overall discount on a quote: list price versus the price actually charged. */
export const discountPercent = (quote: Quote) => {
  const listTotal = quote.items.reduce(
    (sum, item) => sum + item.list * item.qty * billingMultiplier(item),
    0,
  )
  const paidTotal = quote.items.reduce((sum, item) => sum + lineTotal(item), 0)
  return listTotal ? Math.max(0, ((listTotal - paidTotal) / listTotal) * 100) : 0
}

/** What one line would cost at list price, before GST. */
export const lineListAmount = (item: Item) => item.list * item.qty * billingMultiplier(item)

/** Discount on a single line compared with its list price. */
export const lineDiscountPercent = (item: Item) =>
  item.list > 0 ? Math.max(0, ((item.list - item.price) / item.list) * 100) : 0

/** Whole quote at list price, before GST. */
export const quoteListTotal = (quote: Quote) =>
  quote.items.reduce((sum, item) => sum + lineListAmount(item), 0)

/** Whole quote at the price the client pays, before GST. */
export const quoteSubtotal = (quote: Quote) =>
  quote.items.reduce((sum, item) => sum + lineTotal(item), 0)

/** Rupees given away as discount on the quote. */
export const quoteDiscountAmount = (quote: Quote) =>
  Math.max(0, quoteListTotal(quote) - quoteSubtotal(quote))

/** Amount the client pays: every line plus its GST. */
export const quoteTotal = (quote: Quote) =>
  quote.items.reduce((sum, item) => sum + lineTotal(item) * (1 + item.gst / 100), 0)

/** Who must approve a discount: auto-approved up to the first limit, Admin or CEO up to the second, CEO only above it. */
export const approverForDiscount = (
  percent: number,
  limits: Settings = { auto: 5, admin: 15 },
): 'auto' | 'admin' | 'ceo' =>
  percent <= limits.auto ? 'auto' : percent <= limits.admin ? 'admin' : 'ceo'

/** True if any line is priced below the minimum price set for that product in Settings. */
export const hasPriceBelowMinimum = (quote: Quote, products: Product[]) =>
  quote.items.some((item) => {
    const catalogProduct = products.find((product) => product.name === item.product)
    return !!catalogProduct && item.price < catalogProduct.min
  })

/** Who must approve a quote. A price below a product's minimum always needs the CEO; otherwise it depends on the discount. */
export const approverForQuote = (quote: Quote, limits: Settings, products: Product[]) =>
  hasPriceBelowMinimum(quote, products)
    ? 'ceo'
    : approverForDiscount(discountPercent(quote), limits)

/** A quote line with the default 18% GST. Used for the demo data and for new quotes. */
export const makeItem = (
  product: string,
  qty: number,
  list: number,
  price: number,
  billing: Billing = 'One-time',
  term = 1,
): Item => ({
  id: Math.random().toString(36).slice(2),
  product,
  qty,
  list,
  price,
  gst: 18,
  billing,
  term,
})
