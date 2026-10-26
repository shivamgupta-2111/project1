/** Email and WhatsApp message templates filled in from the deal. */
'use client'
import { useEffect, useMemo, useState } from 'react'
import { Mail, MessageCircle, Copy } from 'lucide-react'
import { useStore } from '@/lib/store'
import { toast } from '@/components/Toaster'
import { quoteTotal } from '@/lib/pricing'
import { formatINR } from '@/lib/format'

type T = { id: string; name: string; subject: string; body: string }
// {placeholders} are filled from the deal. Everything stays editable before sending.
const TEMPLATES: T[] = [
  {
    id: 'follow',
    name: 'Quote follow-up',
    subject: 'Following up on quotation {quote}',
    body: 'Hi {client},\n\nI hope you are doing well. I wanted to check if you had a chance to review quotation {quote} ({amount}) for {company}.\n\nHappy to answer any questions or adjust the proposal if needed.\n\nRegards,\n{rep}',
  },
  {
    id: 'send',
    name: 'Send quotation',
    subject: 'Quotation {quote} for {company}',
    body: 'Hi {client},\n\nThank you for your time. Please find our quotation {quote} for {company}. The total is {amount} including GST, valid until {expires}.\n\nLet me know if you would like any changes.\n\nRegards,\n{rep}',
  },
  {
    id: 'revised',
    name: 'Revised offer',
    subject: 'Revised offer for {company}',
    body: 'Hi {client},\n\nWe have reviewed your request and are glad to share a revised quotation {quote} at {amount} including GST.\n\nPlease let me know if this works for you.\n\nRegards,\n{rep}',
  },
  {
    id: 'invoice',
    name: 'Invoice sent',
    subject: 'Invoice {invoice} for {company}',
    body: 'Hi {client},\n\nYour invoice {invoice} for {amount} has been generated, due on {invoiceDue}.\n\nPlease reach out if you need any details.\n\nRegards,\n{rep}',
  },
  {
    id: 'pay',
    name: 'Payment reminder',
    subject: 'Payment reminder: {payment}',
    body: 'Hi {client},\n\nA friendly reminder that {payment} of {payAmount} is due on {payDue}.\n\nPlease let us know once it is processed. Thank you!\n\nRegards,\n{rep}',
  },
  {
    id: 'thanks',
    name: 'Thank you / onboarding',
    subject: 'Welcome aboard, {company}!',
    body: 'Hi {client},\n\nThank you for choosing us. We are excited to work with {company} and will share the onboarding plan shortly.\n\nRegards,\n{rep}',
  },
  {
    id: 'winback',
    name: 'Win-back (lost deal)',
    subject: 'Staying in touch, {company}',
    body: 'Hi {client},\n\nIt has been a little while since we last spoke. If things have changed on your side{reason}, I would be glad to revisit a proposal for {company}.\n\nRegards,\n{rep}',
  },
]
const digits = (p: string) => {
  const d = p.replace(/\D/g, '')
  return d.length === 10 ? '91' + d : d
}
export default function Templates({ dealId, who }: { dealId: string; who: string }) {
  const { deals, quotes, contacts, invoices, payments, logActivity } = useStore()
  const d = deals.find((deal) => deal.id === dealId)!
  const cs = contacts.filter((contact) => contact.dealId === dealId)
  const q = quotes.filter((quote) => quote.dealId === dealId && quote.status !== 'Rejected')
  const bestQ = q.find((quote) => quote.final) || q[q.length - 1]
  const inv = bestQ && invoices.find((invoice) => invoice.quoteId === bestQ.id)
  const pay = payments
    .filter((payment) => payment.dealId === dealId && payment.status === 'Due')
    .sort((a, payment) => a.due.localeCompare(payment.due))[0]
  const start =
    d.outcome === 'Cancelled'
      ? 'winback'
      : d.outcome === 'Won'
        ? inv
          ? 'invoice'
          : 'thanks'
        : bestQ
          ? bestQ.status === 'Draft' || bestQ.status === 'Approved'
            ? 'send'
            : 'follow'
          : 'follow'
  const [templateId, setTemplateId] = useState(start)
  const [channel, setChannel] = useState<'Email' | 'WhatsApp'>('WhatsApp')
  const [contactIndex, setContactIndex] = useState(0)
  const c = cs[contactIndex]
  const t = TEMPLATES.find((template) => template.id === templateId)!
  const fill = useMemo(
    () => (s: string) => {
      const v: Record<string, string> = {
        client: c?.name || d.client,
        company: d.company,
        rep: who,
        quote: bestQ?.id || '(quote)',
        amount: bestQ ? formatINR(quoteTotal(bestQ)) : '(amount)',
        expires: bestQ?.expires || '(date)',
        invoice: inv?.id || '(invoice)',
        invoiceDue: inv?.due || '(date)',
        payment: pay ? `${pay.kind.toLowerCase()} payment ${pay.n}/${pay.of}` : '(payment)',
        payAmount: pay ? formatINR(pay.amount) : '(amount)',
        payDue: pay?.due || '(date)',
        reason: d.lostReason ? ` (${d.lostReason.toLowerCase()})` : '',
      }
      return s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '{' + k + '}')
    },
    [c, d, who, bestQ, inv, pay],
  )
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  useEffect(() => {
    setSubject(fill(t.subject))
    setBody(fill(t.body))
  }, [templateId, contactIndex, fill, t])
  const to = channel === 'Email' ? c?.email : c?.phone
  const send = () => {
    if (!to)
      return toast(`Add a ${channel === 'Email' ? 'email' : 'phone number'} to the contact first`)
    if (channel === 'Email')
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    else
      window.open(
        `https://wa.me/${digits(to)}?text=${encodeURIComponent(body)}`,
        '_blank',
        'noopener',
      )
    logActivity(dealId, `${channel} opened to ${c.name}: ${t.name}`)
  }
  return (
    <div className="box mt-4">
      <p className="mb-1 font-medium">Message templates</p>
      <p className="mb-3 text-xs text-mute">
        Pick a template, edit if needed, then open it in your email app or WhatsApp. Details are
        filled from this deal.
      </p>
      {cs.length === 0 ? (
        <p className="rounded-2xl border border-line p-3 text-sm text-mute">
          Add a contact with a phone or email under “Contact details” to use templates.
        </p>
      ) : (
        <>
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <select
              aria-label="Template"
              className="inp"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Contact"
              className="inp"
              value={contactIndex}
              onChange={(event) => setContactIndex(Number(event.target.value))}
            >
              {cs.map((contact, index) => (
                <option key={contact.id} value={index}>
                  {contact.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              {(['WhatsApp', 'Email'] as const).map((x) => (
                <button
                  key={x}
                  onClick={() => setChannel(x)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${channel === x ? 'border-brand bg-brand/10 text-brand' : 'border-line text-mute'}`}
                >
                  {x === 'Email' ? <Mail size={15} /> : <MessageCircle size={15} />}
                  {x}
                </button>
              ))}
            </div>
          </div>
          {channel === 'Email' && (
            <input
              className="inp mb-2"
              aria-label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          )}
          <textarea
            rows={8}
            className="inp"
            aria-label="Message"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn" onClick={send}>
              {channel === 'Email' ? 'Open in email app' : 'Open in WhatsApp'}
            </button>
            <button
              className="btn2 flex items-center gap-2"
              onClick={() => {
                navigator.clipboard?.writeText(
                  channel === 'Email' ? `Subject: ${subject}\n\n${body}` : body,
                )
                toast('Copied')
              }}
            >
              <Copy size={15} />
              Copy
            </button>
            <span className="text-xs text-mute">
              To: {to || `no ${channel === 'Email' ? 'email' : 'phone'} on file`}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
