/** Shared style constants for the UI. */
import type { Deal } from '@/lib/types'

/** Badge colours for a deal's risk level. */
export const RISK_STYLES: Record<Deal['risk'], string> = {
  Low: 'bg-green-500/15 text-green-600',
  Medium: 'bg-amber-500/15 text-amber-600',
  High: 'bg-red-500/15 text-red-500',
}
