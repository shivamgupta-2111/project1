import { Deal } from '@/lib/store'
export const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
// "Acme Traders Pvt. Ltd." and "ACME traders private limited" should look the same
const NOISE = /\b(private|pvt|limited|ltd|llp|llc|inc|corp|corporation|company|co|the|and)\b/g
export const norm = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(NOISE, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
const lev = (a: string, b: string) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length] }
export type Dupe = { deal: Deal; reason: 'Same GST number' | 'Same company name' | 'Similar company name'; strong: boolean }
// Compare a company name and/or GST number against existing deals.
export function findDupes(deals: Deal[], q: { company?: string; gst?: string }): Dupe[] {
  const n = norm(q.company || ''); const g = (q.gst || '').trim().toUpperCase(); const out: Dupe[] = []
  for (const d of deals) {
    if (g.length >= 15 && d.gst.trim().toUpperCase() === g) { out.push({ deal: d, reason: 'Same GST number', strong: true }); continue }
    if (n.length < 3) continue
    const m = norm(d.company)
    if (m === n) out.push({ deal: d, reason: 'Same company name', strong: true })
    else if (n.length >= 5 && m.length >= 5 && (m.includes(n) || n.includes(m) || lev(n, m) <= (Math.max(n.length, m.length) >= 9 ? 2 : 1))) out.push({ deal: d, reason: 'Similar company name', strong: false })
  }
  return out.sort((a, b) => Number(b.strong) - Number(a.strong)).slice(0, 4)
}
// Every pair of existing deals that look like the same client (for the admin report)
export function dupePairs(deals: Deal[]) {
  const out: { a: Deal; b: Deal; reason: Dupe['reason'] }[] = []
  deals.forEach((a, i) => { const rest = deals.slice(i + 1); findDupes(rest, { company: a.company, gst: a.gst }).forEach((x) => out.push({ a, b: x.deal, reason: x.reason })) })
  return out
}
