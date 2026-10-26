/** Helpers that answer questions about a deal (won, lost, how much it is worth). */
import { Deal, Quote } from '@/lib/types'
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
