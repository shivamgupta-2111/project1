/** Small helpers for ids and dates. */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Today's date plus `days` (use a negative number for the past), as "YYYY-MM-DD". */
export const todayPlus = (days: number) =>
  new Date(Date.now() + days * MS_PER_DAY).toISOString().slice(0, 10)

/** A short random id. Good enough for a browser-only demo. */
export const uid = () => Math.random().toString(36).slice(2)

/**
 * Adds months to a "YYYY-MM-DD" date. If the day doesn't exist in the target month
 * it moves to the month's last day (31 Jan + 1 month = 28 Feb).
 */
export const addMonths = (isoDate: string, months: number) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDayOfTarget = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDayOfTarget))
  return target.toISOString().slice(0, 10)
}
