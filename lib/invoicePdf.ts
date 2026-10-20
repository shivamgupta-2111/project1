import { lineAmt } from '@/lib/store'
import type { Invoice, Quote, Deal } from '@/lib/store'
export async function downloadInvoicePdf(inv: Invoice, q: Quote, d: Deal) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210; const rs = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-IN')
  doc.setFillColor(232, 119, 34); doc.roundedRect(15, 14, 10, 10, 2, 2, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text('P', 20, 21, { align: 'center' })
  doc.setTextColor(26, 26, 46); doc.setFontSize(16); doc.text('Pipeline CRM', 28, 21)
  doc.setFontSize(22); doc.text('INVOICE', W - 15, 21, { align: 'right' })
  doc.setFontSize(10); doc.setTextColor(110, 110, 115); doc.text(`${inv.id}  |  Date ${inv.date}  |  Due ${inv.due}`, W - 15, 28, { align: 'right' }); doc.text(`Status: ${inv.status}`, W - 15, 33, { align: 'right' })
  doc.setTextColor(110, 110, 115); doc.text('Bill to', 15, 48); doc.setTextColor(26, 26, 46); doc.setFontSize(12); doc.text(d.company, 15, 54); doc.setFontSize(10); doc.text(d.client, 15, 60); doc.text(`GST ${d.gst || '-'}`, 15, 66)
  doc.setTextColor(110, 110, 115); doc.text(`Based on quotation ${q.id} (final)`, 15, 72)
  let y = 86; doc.setDrawColor(220); doc.line(15, y - 6, W - 15, y - 6); doc.setTextColor(110, 110, 115)
  doc.text('Item', 15, y); doc.text('Qty', 115, y); doc.text('Unit price', 150, y, { align: 'right' }); doc.text('Amount', W - 15, y, { align: 'right' }); y += 4; doc.line(15, y, W - 15, y); y += 7; doc.setTextColor(26, 26, 46)
  for (const i of q.items) {
    if (y > 265) { doc.addPage(); y = 20 }
    const sub = i.billing && i.billing !== 'One-time' ? ` (${i.billing}, ${i.term ?? 12} months)` : ''
    doc.text(i.product + sub, 15, y); doc.text(String(i.qty), 115, y); doc.text(rs(i.price), 150, y, { align: 'right' }); doc.text(rs(lineAmt(i)), W - 15, y, { align: 'right' }); y += 8
  }
  y += 4; doc.line(120, y - 4, W - 15, y - 4)
  doc.text('Subtotal', 125, y); doc.text(rs(inv.subtotal), W - 15, y, { align: 'right' }); y += 7
  doc.text('GST (18%)', 125, y); doc.text(rs(inv.gst), W - 15, y, { align: 'right' }); y += 9
  doc.setFontSize(13); doc.text('Total', 125, y); doc.text(rs(inv.amount), W - 15, y, { align: 'right' })
  doc.setFontSize(9); doc.setTextColor(110, 110, 115); doc.text(`Created by ${inv.by}. Thank you for your business.`, 15, 285)
  doc.save(`${inv.id}.pdf`)
}
