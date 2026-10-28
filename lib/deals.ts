/** Helpers that answer questions about a deal (won, lost, how much it is worth). */
import { Deal, Invoice, Quote } from '@/lib/types'
import { quoteTotal } from '@/lib/pricing'

/** A deal is won when it reached the Closed stage and was not cancelled. */
export const isWon = (deal: Deal) => deal.stage === 4 && deal.outcome !== 'Cancelled'

/** A deal is lost when it reached the Closed stage and was cancelled. */
export const isLost = (deal: Deal) => deal.stage === 4 && deal.outcome === 'Cancelled'

/** What a deal is worth: the final (or accepted) quote if there is one, otherwise the biggest open quote. */
export const dealValue = (allQuotes: Quote[], dealId: string) => {
  const dealQuotes = allQuotes.filter(
    (quote) => quote.dealId === dealId && quote.status !== 'Rejected',
  )
  const winningQuote =
    dealQuotes.find((quote) => quote.final) ||
    dealQuotes.find((quote) => quote.status === 'Accepted')
  return winningQuote ? quoteTotal(winningQuote) : Math.max(0, ...dealQuotes.map(quoteTotal))
}

/** The newest quotation of a deal (quotes are added in order, so it is the last one). */
export const latestQuote = (allQuotes: Quote[], dealId: string) =>
  allQuotes.filter((quote) => quote.dealId === dealId).pop()

/** The invoice of a deal, if one was created (the store adds new invoices at the front, so this is the newest). */
export const dealInvoice = (allInvoices: Invoice[], dealId: string) =>
  allInvoices.find((invoice) => invoice.dealId === dealId)
