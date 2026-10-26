/** Duplicate detection for clients: same GST number, or the same or a similar company name. */
import { Deal } from '@/lib/types'

/** A valid 15-character Indian GST number, e.g. 27AAAAA0000A1Z5. */
export const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

// Words that don't help tell two companies apart ("Acme Pvt. Ltd." vs "ACME Private Limited").
const COMPANY_NOISE =
  /\b(private|pvt|limited|ltd|llp|llc|inc|corp|corporation|company|co|the|and)\b/g

/** Lower-cases a company name and drops punctuation and legal suffixes so similar names compare equal. */
export const normalizeCompanyName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(COMPANY_NOISE, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

/** Number of single-character edits needed to turn `a` into `b` (Levenshtein distance). */
const editDistance = (a: string, b: string) => {
  const table = Array.from({ length: a.length + 1 }, (_, row) => [row, ...Array(b.length).fill(0)])
  for (let col = 1; col <= b.length; col++) table[0][col] = col

  for (let row = 1; row <= a.length; row++) {
    for (let col = 1; col <= b.length; col++) {
      const substitutionCost = a[row - 1] === b[col - 1] ? 0 : 1
      table[row][col] = Math.min(
        table[row - 1][col] + 1, // delete
        table[row][col - 1] + 1, // insert
        table[row - 1][col - 1] + substitutionCost, // substitute
      )
    }
  }
  return table[a.length][b.length]
}

/** True when one name contains the other, or they differ by only a typo or two. */
const looksSimilar = (a: string, b: string) => {
  const allowedTypos = Math.max(a.length, b.length) >= 9 ? 2 : 1
  return a.includes(b) || b.includes(a) || editDistance(a, b) <= allowedTypos
}

export type Dupe = {
  deal: Deal
  reason: 'Same GST number' | 'Same company name' | 'Similar company name'
  /** Strong matches (same GST or same name) are shown in red, weaker ones in amber. */
  strong: boolean
}

/** Looks for existing deals that might be the same client as a company name and/or GST number. */
export function findDupes(deals: Deal[], query: { company?: string; gst?: string }): Dupe[] {
  const queryName = normalizeCompanyName(query.company || '')
  const queryGst = (query.gst || '').trim().toUpperCase()
  const matches: Dupe[] = []

  for (const deal of deals) {
    // A full GST number identifies the legal entity, so it is the strongest signal.
    if (queryGst.length >= 15 && deal.gst.trim().toUpperCase() === queryGst) {
      matches.push({ deal, reason: 'Same GST number', strong: true })
      continue
    }
    if (queryName.length < 3) continue

    const existingName = normalizeCompanyName(deal.company)
    if (existingName === queryName) {
      matches.push({ deal, reason: 'Same company name', strong: true })
    } else if (
      queryName.length >= 5 &&
      existingName.length >= 5 &&
      looksSimilar(queryName, existingName)
    ) {
      matches.push({ deal, reason: 'Similar company name', strong: false })
    }
  }
  return matches.sort((a, b) => Number(b.strong) - Number(a.strong)).slice(0, 4)
}

/** Every pair of existing deals that look like the same client (used by the Reports page). */
export function dupePairs(deals: Deal[]) {
  const pairs: { a: Deal; b: Deal; reason: Dupe['reason'] }[] = []
  deals.forEach((deal, index) => {
    const laterDeals = deals.slice(index + 1)
    findDupes(laterDeals, { company: deal.company, gst: deal.gst }).forEach((match) =>
      pairs.push({ a: deal, b: match.deal, reason: match.reason }),
    )
  })
  return pairs
}
