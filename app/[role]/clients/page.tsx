/** Client list with search; each card links to its deal. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import Avatar from '@/components/Avatar'
import RepLink from '@/components/RepLink'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'
import { dealInvoice, dealValue, latestQuote } from '@/lib/deals'
import { STAGES } from '@/lib/constants'
import { RISK_STYLES } from '@/lib/ui'

export default function Clients() {
  const role = useParams().role as Role
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const { deals, quotes, invoices, contacts, activity } = useStore()
  const [search, setSearch] = useState('')
  const mine = role === 'rep' ? deals.filter((deal) => deal.rep === myName) : deals
  const list = mine.filter((deal) =>
    (
      deal.company +
      deal.client +
      (latestQuote(quotes, deal.id)?.id ?? '') +
      (dealInvoice(invoices, deal.id)?.id ?? '')
    )
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const last = (id: string) =>
    activity
      .filter((entry) => entry.dealId === id)
      .map((entry) => entry.at)
      .sort()
      .pop()
  return (
    <Shell role={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-mute">{mine.length} companies</p>
        </div>
        <input
          className="inp max-w-xs"
          placeholder="Search client, quote or invoice no."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.key === 'Escape' && setSearch('')}
        />
      </div>
      {list.length === 0 && <p className="box text-sm text-mute">No clients match your search.</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((deal) => (
          <div key={deal.id} className="box relative transition hover:border-brand hover:shadow-md">
            <div className="flex items-center gap-3">
              <Avatar name={deal.company} size={40} />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <Link href={`/${role}/deals/${deal.id}`} className="after:absolute after:inset-0">
                    {deal.company}
                  </Link>
                </p>
                <p className="text-xs text-mute">
                  {deal.client} · Rep <RepLink name={deal.rep} />
                </p>
              </div>
              <span className={`pill relative ml-auto ${RISK_STYLES[deal.risk]}`}>
                {deal.risk} risk
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-base font-semibold">
                  ₹{Math.round(dealValue(quotes, deal.id)).toLocaleString('en-IN')}
                </p>
                <p className="text-mute">Value</p>
              </div>
              <div>
                <p className="text-base font-semibold">
                  {contacts.filter((contact) => contact.dealId === deal.id).length}
                </p>
                <p className="text-mute">Contacts</p>
              </div>
              <div>
                <p className="text-base font-semibold">{STAGES[deal.stage]}</p>
                <p className="text-mute">Stage</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs">
              <p>
                <span className="text-mute">Latest quote</span>
                <br />
                <b>{latestQuote(quotes, deal.id)?.id ?? '—'}</b>
                {latestQuote(quotes, deal.id) && (
                  <span className="text-mute"> · {latestQuote(quotes, deal.id)!.status}</span>
                )}
              </p>
              <p>
                <span className="text-mute">Invoice no.</span>
                <br />
                <b>{dealInvoice(invoices, deal.id)?.id ?? '—'}</b>
                {dealInvoice(invoices, deal.id) && (
                  <span className="text-mute"> · {dealInvoice(invoices, deal.id)!.status}</span>
                )}
              </p>
            </div>
            <p className="mt-3 text-xs text-mute">
              GST {deal.gst || '—'} · Last activity{' '}
              {last(deal.id)
                ? new Date(last(deal.id)!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : '—'}
            </p>
          </div>
        ))}
      </div>
    </Shell>
  )
}
