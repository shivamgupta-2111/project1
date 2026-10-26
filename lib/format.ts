/** Number formatting helpers. */
/** Formats a number as Indian rupees, e.g. 125000 -> "₹1,25,000". */
export const formatINR = (amount: number) => '₹' + Math.round(amount).toLocaleString('en-IN')
