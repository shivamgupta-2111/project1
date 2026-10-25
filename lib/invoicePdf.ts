import { lineAmt, lineDiscPct, origAmt } from '@/lib/store'
import type { Invoice, Quote, Deal } from '@/lib/store'
export async function downloadInvoicePdf(inv: Invoice, q: Quote, d: Deal) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210; const rs = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-IN')
  doc.setFillColor(37, 99, 235); doc.roundedRect(15, 14, 10, 10, 2, 2, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text('P', 20, 21, { align: 'center' })
  doc.setTextColor(15, 23, 42); doc.setFontSize(16); doc.text('Pipeline CRM', 28, 21)
  doc.setFontSize(22); doc.text('INVOICE', W - 15, 21, { align: 'right' })
  doc.setFontSize(10); doc.setTextColor(110, 110, 115); doc.text(`${inv.id}  |  Date ${inv.date}  |  Due ${inv.due}`, W - 15, 28, { align: 'right' }); doc.text(`Status: ${inv.status}`, W - 15, 33, { align: 'right' })
  doc.setTextColor(110, 110, 115); doc.text('Bill to', 15, 48); doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.text(d.company, 15, 54); doc.setFontSize(10); doc.text(d.client, 15, 60); doc.text(`GST ${d.gst || '-'}`, 15, 66)
  doc.setTextColor(110, 110, 115); doc.text(`Based on quotation ${q.id} (final)`, 15, 72)
  let y = 86; doc.setDrawColor(220); doc.line(15, y - 6, W - 15, y - 6); doc.setTextColor(110, 110, 115)
  doc.text('Item', 15, y); doc.text('Qty', 88, y); doc.text('Original', 122, y, { align: 'right' }); doc.text('Disc.', 138, y, { align: 'right' }); doc.text('Unit price', 163, y, { align: 'right' }); doc.text('Amount', W - 15, y, { align: 'right' }); y += 4; doc.line(15, y, W - 15, y); y += 7; doc.setTextColor(15, 23, 42)
  for (const i of q.items) {
    if (y > 265) { doc.addPage(); y = 20 }
    const sub = i.billing && i.billing !== 'One-time' ? ` (${i.billing}, ${i.term ?? 12} months)` : ''
    const lp = lineDiscPct(i); doc.setFontSize(9); doc.text(doc.splitTextToSize(i.product + sub, 68)[0], 15, y); doc.text(String(i.qty), 88, y); doc.text(rs(i.list), 122, y, { align: 'right' }); doc.text(lp > 0 ? lp.toFixed(1) + '%' : '-', 138, y, { align: 'right' }); doc.text(rs(i.price), 163, y, { align: 'right' }); doc.text(rs(lineAmt(i)), W - 15, y, { align: 'right' }); doc.setFontSize(10); y += 8
  }
  y += 4; doc.line(120, y - 4, W - 15, y - 4)
  const orig = q.items.reduce((t, i) => t + origAmt(i), 0)
  if (orig > inv.subtotal + 0.5) { doc.text('Original price', 125, y); doc.text(rs(orig), W - 15, y, { align: 'right' }); y += 7; doc.text(`Discount (${((1 - inv.subtotal / orig) * 100).toFixed(1)}%)`, 125, y); doc.text('-' + rs(orig - inv.subtotal), W - 15, y, { align: 'right' }); y += 7 }
  doc.text(orig > inv.subtotal + 0.5 ? 'Price after discount' : 'Subtotal', 125, y); doc.text(rs(inv.subtotal), W - 15, y, { align: 'right' }); y += 7
  doc.text('GST (18%)', 125, y); doc.text(rs(inv.gst), W - 15, y, { align: 'right' }); y += 9
  doc.setFontSize(13); doc.text('Total', 125, y); doc.text(rs(inv.amount), W - 15, y, { align: 'right' })
  doc.setFontSize(9); doc.setTextColor(110, 110, 115); doc.text(`Created by ${inv.by}. Thank you for your business.`, 15, 285)
  doc.save(`${inv.id}.pdf`)
}
