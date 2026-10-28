/** Draws an invoice as a PDF using jsPDF. */
import type { Invoice, Quote, Deal, Settings } from '@/lib/types'
import { lineDiscountPercent, lineListAmount, lineTotal } from '@/lib/pricing'

export async function downloadInvoicePdf(inv: Invoice, quote: Quote, deal: Deal, settings: Settings) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const rs = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-IN')
  doc.setFillColor(232, 119, 34)
  doc.roundedRect(15, 14, 10, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.text('P', 20, 21, { align: 'center' })
  doc.setTextColor(26, 26, 46)
  doc.setFontSize(16)
  doc.text('Pipeline CRM', 28, 21)
  doc.setFontSize(22)
  doc.text('INVOICE', W - 15, 21, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 115)
  doc.text(`${inv.id}  |  Date ${inv.date}  |  Due ${inv.due}`, W - 15, 28, { align: 'right' })
  doc.text(`Status: ${inv.status}`, W - 15, 33, { align: 'right' })
  doc.setTextColor(110, 110, 115)
  doc.text('Bill to', 15, 48)
  doc.setTextColor(26, 26, 46)
  doc.setFontSize(12)
  doc.text(deal.company, 15, 54)
  doc.setFontSize(10)
  doc.text(deal.client, 15, 60)
  doc.text(`GST ${deal.gst || '-'}`, 15, 66)
  doc.setTextColor(110, 110, 115)
  doc.text(`Based on quotation ${quote.id} (final)`, 15, 72)
  let y = 86
  doc.setDrawColor(220)
  doc.line(15, y - 6, W - 15, y - 6)
  doc.setTextColor(110, 110, 115)
  doc.text('Item', 15, y)
  doc.text('Qty', 88, y)
  doc.text('Original', 122, y, { align: 'right' })
  doc.text('Disc.', 138, y, { align: 'right' })
  doc.text('Unit price', 163, y, { align: 'right' })
  doc.text('Amount', W - 15, y, { align: 'right' })
  y += 4
  doc.line(15, y, W - 15, y)
  y += 7
  doc.setTextColor(26, 26, 46)
  for (const i of quote.items) {
    if (y > 265) {
      doc.addPage()
      y = 20
    }
    const sub =
      i.billing && i.billing !== 'One-time' ? ` (${i.billing}, ${i.term ?? 12} months)` : ''
    const lp = lineDiscountPercent(i)
    doc.setFontSize(9)
    doc.text(doc.splitTextToSize(i.product + sub, 68)[0], 15, y)
    doc.text(String(i.qty), 88, y)
    doc.text(rs(i.list), 122, y, { align: 'right' })
    doc.text(lp > 0 ? lp.toFixed(1) + '%' : '-', 138, y, { align: 'right' })
    doc.text(rs(i.price), 163, y, { align: 'right' })
    doc.text(rs(lineTotal(i)), W - 15, y, { align: 'right' })
    doc.setFontSize(10)
    y += 8
  }
  y += 4
  doc.line(120, y - 4, W - 15, y - 4)
  const orig = quote.items.reduce((sum, item) => sum + lineListAmount(item), 0)
  if (orig > inv.subtotal + 0.5) {
    doc.text('Original price', 125, y)
    doc.text(rs(orig), W - 15, y, { align: 'right' })
    y += 7
    doc.text(`Discount (${((1 - inv.subtotal / orig) * 100).toFixed(1)}%)`, 125, y)
    doc.text('-' + rs(orig - inv.subtotal), W - 15, y, { align: 'right' })
    y += 7
  }
  doc.text(orig > inv.subtotal + 0.5 ? 'Price after discount' : 'Subtotal', 125, y)
  doc.text(rs(inv.subtotal), W - 15, y, { align: 'right' })
  y += 7
  doc.text('GST (18%)', 125, y)
  doc.text(rs(inv.gst), W - 15, y, { align: 'right' })
  y += 9
  doc.setFontSize(13)
  doc.text('Total', 125, y)
  doc.text(rs(inv.amount), W - 15, y, { align: 'right' })
  doc.setFontSize(10)
  y += 14
  // bank details and QR code
  const bank = settings.bank
  const bankRows = (
    [
      ['Account name', bank?.accountName],
      ['Bank', bank?.bankName],
      ['Account no.', bank?.accountNo],
      ['IFSC', bank?.ifsc],
      ['UPI ID', bank?.upi],
    ] as [string, string | undefined][]
  ).filter(([, value]) => value?.trim())
  if (bankRows.length || settings.qr) {
    const blockHeight = Math.max(bankRows.length * 6 + 8, settings.qr ? 38 : 0)
    if (y + blockHeight > 275) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(110, 110, 115)
    doc.text('Pay to', 15, y)
    bankRows.forEach(([label, value], index) => {
      doc.setTextColor(110, 110, 115)
      doc.text(label, 15, y + 7 + index * 6)
      doc.setTextColor(26, 26, 46)
      doc.text(String(value), 45, y + 7 + index * 6)
    })
    if (settings.qr) {
      doc.addImage(settings.qr, 'PNG', W - 15 - 32, y - 3, 32, 32)
      doc.setFontSize(8)
      doc.setTextColor(110, 110, 115)
      doc.text('Scan to pay', W - 15 - 16, y + 33, { align: 'center' })
      doc.setFontSize(10)
    }
    y += blockHeight + 6
  }
  // terms and conditions (the PDF font has no rupee sign, so it becomes "Rs.")
  const terms = (inv.terms ?? '').replace(/₹/g, 'Rs. ').trim()
  if (terms) {
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(10)
    if (y > 265) {
      doc.addPage()
      y = 20
    }
    doc.text('Terms and conditions', 15, y)
    y += 6
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 65)
    for (const line of doc.splitTextToSize(terms, W - 30) as string[]) {
      if (y > 278) {
        doc.addPage()
        y = 20
      }
      doc.text(line, 15, y)
      y += 4.5
    }
  }
  doc.setFontSize(9)
  doc.setTextColor(110, 110, 115)
  doc.text(`Created by ${inv.by}. Thank you for your business.`, 15, 285)
  doc.save(`${inv.id}.pdf`)
}
