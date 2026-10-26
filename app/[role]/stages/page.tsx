/** Pick a pipeline stage to see which clients are in it. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import Avatar from '@/components/Avatar'
import RepLink from '@/components/RepLink'
import { useStore } from '@/lib/store'
import { Deal, Role } from '@/lib/types'
import { dealValue } from '@/lib/deals'
import { formatINR } from '@/lib/format'
import { RISK_STYLES } from '@/lib/ui'

// Same 6 columns as the Pipeline page: Done and Cancelled are split out of "Closed"
const COLS = ['Discover', 'Identify', 'Next', 'Proposal', 'Closed · Done', 'Cancelled']
const colOf = (deal: Deal) => (deal.stage < 4 ? deal.stage : deal.outcome === 'Cancelled' ? 5 : 4)

export default function Stages() {
  const role = useParams().role as Role
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const { deals, quotes, users } = useStore()
  const [selectedStage, setSelectedStage] = useState(0)
  const [repFilter, setRepFilter] = useState('All')
  const [search, setSearch] = useState('')
  const isManager = role !== 'rep'
  const reps = users.filter((user) => user.role === 'rep').map((user) => user.name)
  const base = deals.filter((deal) =>
    isManager ? repFilter === 'All' || deal.rep === repFilter : deal.rep === myName,
  )
  const count = (i: number) => base.filter((deal) => colOf(deal) === i).length
  const list = base.filter(
    (deal) =>
      colOf(deal) === selectedStage &&
      (deal.company + deal.client).toLowerCase().includes(search.toLowerCase()),
  )
  const total = list.reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
  const tone = (i: number) => (i === 4 ? 'text-green-600' : i === 5 ? 'text-red-500' : 'text-brand')
  return (
    <Shell role={role}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stages</h1>
          <p className="text-sm text-mute">Tap a stage to see which clients are in it.</p>
        </div>
        {isManager && (
          <select
            aria-label="Filter by rep"
            className="inp !w-auto"
            value={repFilter}
            onChange={(event) => setRepFilter(event.target.value)}
          >
            <option>All</option>
            {reps.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        )}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {COLS.map((column, index) => (
          <button
            key={column}
            onClick={() => setSelectedStage(index)}
            className={`box !p-4 text-left transition ${selectedStage === index ? 'border-brand ring-2 ring-brand/40' : ''}`}
          >
            <p className={`text-xs font-medium ${tone(index)}`}>{column}</p>
            <p className="mt-1 text-2xl font-semibold">{count(index)}</p>
            <p className="text-[11px] text-mute">client{count(index) === 1 ? '' : 's'}</p>
          </button>
        ))}
      </div>
      <div className="box">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">{COLS[selectedStage]}</h2>
            <p className="text-xs text-mute">
              {list.length} client{list.length === 1 ? '' : 's'} · {formatINR(total)}
            </p>
          </div>
          <input
            className="inp !w-full md:!w-64"
            placeholder="Search client or company"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-mute">No clients in this stage.</p>
        ) : (
          <ul className="grid gap-2">
            {list.map((deal) => (
              <li key={deal.id} className="relative">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand">
                  <Avatar name={deal.company} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <Link
                        href={`/${role}/deals/${deal.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {deal.company}
                      </Link>
                    </p>
                    <p className="text-xs text-mute">
                      {deal.client}
                      {isManager && (
                        <>
                          {' '}
                          · Rep: <RepLink name={deal.rep} />
                        </>
                      )}
                    </p>
                  </div>
                  <span className={`pill ${RISK_STYLES[deal.risk]}`}>{deal.risk} risk</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatINR(dealValue(quotes, deal.id))}</p>
                    <p className="text-[11px] text-mute">
                      {selectedStage >= 4
                        ? `Closed ${deal.closedAt ?? ''}`
                        : `Target ${deal.target}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  )
}
