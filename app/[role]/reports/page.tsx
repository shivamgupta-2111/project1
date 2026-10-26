/** Reports (Admin and CEO): pipeline, discounts, win rate, lost reasons, calls, duplicates. */
'use client'
import { useParams } from 'next/navigation'
import { Download } from 'lucide-react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import Link from 'next/link'
import RepLink from '@/components/RepLink'
import { dupePairs } from '@/lib/dupes'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'
import { LOST_REASONS, STAGES } from '@/lib/constants'
import { dealValue, isLost, isWon } from '@/lib/deals'
import { annualRecurringRevenue, discountPercent } from '@/lib/pricing'
import { formatINR } from '@/lib/format'

const PROB = [0.1, 0.25, 0.5, 0.75, 1]

function Bars({
  rows,
  fmt = formatINR,
}: {
  rows: [React.ReactNode, number][]
  fmt?: (n: number) => string
}) {
  const m = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <div className="grid gap-3">
      {rows.map(([l, v], index) => (
        <div key={index}>
          <div className="flex justify-between text-sm">
            <span>{l}</span>
            <span className="text-mute">{fmt(v)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${(v / m) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
export default function Reports() {
  const role = useParams().role as Role
  const { deals, quotes, activity, records } = useStore()
  if (role === 'rep')
    return (
      <Shell role={role}>
        <p className="box text-sm text-mute">Reports are available to Admin and CEO.</p>
      </Shell>
    )
  const val = (id: string) => dealValue(quotes, id)
  const open = deals.filter((deal) => deal.stage < 4)
  const pipeline = open.reduce((sum, deal) => sum + val(deal.id), 0)
  const weighted = open.reduce((sum, deal) => sum + val(deal.id) * PROB[deal.stage], 0)
  const won = deals.filter(isWon)
  const wonVal = won.reduce((sum, deal) => sum + val(deal.id), 0)
  const arr = won.reduce((sum, deal) => {
    const f = quotes.find((quote) => quote.dealId === deal.id && quote.final)
    return sum + (f ? annualRecurringRevenue(f) : 0)
  }, 0)
  const lost = deals.filter(isLost)
  const disc = quotes.length
    ? quotes.reduce((sum, quote) => sum + discountPercent(quote), 0) / quotes.length
    : 0
  const months = [...new Set(open.map((deal) => deal.target.slice(0, 7)))].sort()
  const fc = months.map(
    (m) =>
      [
        new Date(m + '-01').toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        open
          .filter((deal) => deal.target.startsWith(m))
          .reduce((sum, deal) => sum + val(deal.id) * PROB[deal.stage], 0),
      ] as [string, number],
  )
  const reps = [...new Set(deals.map((deal) => deal.rep))]
  const csv = () => {
    const rows = deals.map((deal) =>
      [
        deal.company,
        deal.client,
        deal.rep,
        STAGES[deal.stage],
        deal.risk,
        deal.target,
        Math.round(val(deal.id)),
      ]
        .map((x) => `"${x}"`)
        .join(','),
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([['Deal,Client,Rep,Stage,Risk,Target,Value', ...rows].join('\n')], {
        type: 'text/csv',
      }),
    )
    a.download = 'deals.csv'
    a.click()
    toast('CSV downloaded')
  }
  const dl = (name: string, head: string[], rows: (string | number)[][]) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob(
        [
          [
            head.join(','),
            ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')),
          ].join('\n'),
        ],
        { type: 'text/csv' },
      ),
    )
    a.download = name
    a.click()
    toast('CSV downloaded')
  }
  const reasonOf = (d: { lostReason?: string }) => d.lostReason || 'Not recorded'
  const reasons = [...LOST_REASONS, 'Not recorded']
    .map((r) => ({
      r,
      n: lost.filter((deal) => reasonOf(deal) === r).length,
      v: lost.filter((deal) => reasonOf(deal) === r).reduce((sum, deal) => sum + val(deal.id), 0),
    }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  const lostByRep = reps
    .map(
      (r) =>
        [<RepLink key={r} name={r} />, lost.filter((deal) => deal.rep === r).length] as [
          React.ReactNode,
          number,
        ],
    )
    .filter((x) => x[1] > 0)
  const outreach = activity.filter((entry) => /^(Email|WhatsApp) opened/.test(entry.text))
  const outBy = [...new Set(outreach.map((entry) => entry.by || 'System'))].map(
    (n) =>
      [
        <RepLink key={n} name={n} />,
        outreach.filter((entry) => (entry.by || 'System') === n).length,
      ] as [React.ReactNode, number],
  )
  const since = new Date(Date.now() - 30 * 864e5).toISOString()
  const talks = records.filter(
    (record) => (record.type === 'Call' || record.type === 'Meeting') && record.at >= since,
  )
  const talkBy = reps.map(
    (r) =>
      [<RepLink key={r} name={r} />, talks.filter((record) => record.by === r).length] as [
        React.ReactNode,
        number,
      ],
  )
  const dupes = dupePairs(deals)
  const kpi = [
    ['Open pipeline', formatINR(pipeline)],
    ['Weighted forecast', formatINR(weighted)],
    ['Won revenue', formatINR(wonVal)],
    ['Conversion', `${Math.round((won.length / Math.max(deals.length, 1)) * 100)}%`],
    ['Avg discount', disc.toFixed(1) + '%'],
    ['ARR (won)', formatINR(arr)],
    ['MRR (won)', formatINR(arr / 12)],
    [
      'Churned deals',
      `${lost.length} · ${formatINR(lost.reduce((sum, deal) => sum + val(deal.id), 0))}`,
    ],
    ['Top loss reason', reasons[0] ? `${reasons[0].r} (${reasons[0].n})` : '—'],
    [
      'Win rate (closed)',
      `${Math.round((won.length / Math.max(won.length + lost.length, 1)) * 100)}%`,
    ],
  ]
  return (
    <Shell role={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-mute">
            Forecast is weighted by stage: 10%, 25%, 50%, 75%, 100%.
          </p>
        </div>
        <button className="btn2 flex items-center gap-2" onClick={csv}>
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpi.map(([k, v]) => (
          <div key={k} className="box">
            <p className="text-sm text-mute">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="box">
          <p className="mb-4 font-medium">Forecast by month</p>
          <Bars rows={fc} />
        </div>
        <div className="box">
          <p className="mb-4 font-medium">Pipeline funnel (deals)</p>
          <Bars
            fmt={(n) => String(n)}
            rows={STAGES.map((stage, index) => [
              stage,
              deals.filter((deal) => deal.stage === index).length,
            ])}
          />
        </div>
        <div className="box">
          <p className="mb-4 font-medium">Pipeline value by rep</p>
          <Bars
            rows={reps.map((r) => [
              <RepLink key={r} name={r} />,
              open.filter((deal) => deal.rep === r).reduce((sum, deal) => sum + val(deal.id), 0),
            ])}
          />
        </div>
        <div className="box">
          <p className="mb-4 font-medium">Average discount by rep</p>
          <Bars
            fmt={(n) => n.toFixed(1) + '%'}
            rows={reps.map((r) => {
              const q = quotes.filter(
                (quote) => deals.find((deal) => deal.id === quote.dealId)?.rep === r,
              )
              return [
                <RepLink key={r} name={r} />,
                q.length ? q.reduce((sum, quote) => sum + discountPercent(quote), 0) / q.length : 0,
              ]
            })}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="box">
          <p className="mb-1 font-medium text-red-500">Lost reasons</p>
          <p className="mb-4 text-xs text-mute">Why deals were cancelled (number of deals)</p>
          {reasons.length === 0 ? (
            <p className="text-sm text-mute">No cancelled deals yet.</p>
          ) : (
            <Bars fmt={(n) => String(n)} rows={reasons.map((x) => [x.r, x.n])} />
          )}
        </div>
        <div className="box">
          <p className="mb-1 font-medium text-red-500">Revenue lost by reason</p>
          <p className="mb-4 text-xs text-mute">Quoted value of cancelled deals</p>
          {reasons.length === 0 ? (
            <p className="text-sm text-mute">No cancelled deals yet.</p>
          ) : (
            <Bars rows={reasons.map((x) => [x.r, x.v])} />
          )}
        </div>
        <div className="box">
          <p className="mb-4 font-medium">Cancelled deals by rep</p>
          {lostByRep.length === 0 ? (
            <p className="text-sm text-mute">None.</p>
          ) : (
            <Bars fmt={(n) => String(n)} rows={lostByRep} />
          )}
        </div>
        <div className="box">
          <p className="mb-1 font-medium">Client outreach by rep</p>
          <p className="mb-4 text-xs text-mute">
            Emails and WhatsApp messages opened from templates
          </p>
          {outBy.length === 0 ? (
            <p className="text-sm text-mute">No messages sent from templates yet.</p>
          ) : (
            <Bars fmt={(n) => String(n)} rows={outBy} />
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="box">
          <p className="mb-1 font-medium">Calls and meetings by rep</p>
          <p className="mb-4 text-xs text-mute">
            Logged in the last 30 days ({talks.length} total)
          </p>
          {talkBy.every((x) => x[1] === 0) ? (
            <p className="text-sm text-mute">No calls or meetings logged yet.</p>
          ) : (
            <Bars fmt={(n) => String(n)} rows={talkBy} />
          )}
        </div>
        <div className="box">
          <p className="mb-1 font-medium">Possible duplicate clients</p>
          <p className="mb-4 text-xs text-mute">Same GST number or a very similar company name</p>
          {dupes.length === 0 ? (
            <p className="text-sm text-green-600">No duplicates found.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {dupes.map((x) => (
                <li key={x.a.id + x.b.id} className="rounded-lg border border-line p-2.5">
                  <Link href={`/${role}/deals/${x.a.id}`} className="font-medium hover:text-brand">
                    {x.a.company}
                  </Link>{' '}
                  <span className="text-mute">↔</span>{' '}
                  <Link href={`/${role}/deals/${x.b.id}`} className="font-medium hover:text-brand">
                    {x.b.company}
                  </Link>
                  <p className="mt-0.5 text-xs text-mute">
                    {x.reason} · <RepLink name={x.a.rep} />
                    {x.a.rep !== x.b.rep && (
                      <>
                        {' '}
                        and <RepLink name={x.b.rep} />
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="box mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Lost deals</p>
          <button
            className="btn2 flex items-center gap-2"
            onClick={() =>
              dl(
                'lost-deals.csv',
                ['Deal', 'Client', 'Rep', 'Reason', 'Note', 'Value', 'Closed'],
                lost.map((deal) => [
                  deal.company,
                  deal.client,
                  deal.rep,
                  reasonOf(deal),
                  deal.closeNote || '',
                  Math.round(val(deal.id)),
                  deal.closedAt || '',
                ]),
              )
            }
          >
            <Download size={16} />
            Export lost deals
          </button>
        </div>
        {lost.length === 0 ? (
          <p className="text-sm text-mute">No cancelled deals yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-mute">
                <tr>
                  <th className="py-2 pr-3">Deal</th>
                  <th className="pr-3">Rep</th>
                  <th className="pr-3">Reason</th>
                  <th className="pr-3">Note</th>
                  <th className="pr-3 text-right">Value</th>
                  <th>Closed</th>
                </tr>
              </thead>
              <tbody>
                {lost.map((deal) => (
                  <tr key={deal.id} className="border-t border-line">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/${role}/deals/${deal.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {deal.company}
                      </Link>
                    </td>
                    <td className="pr-3">
                      <RepLink name={deal.rep} />
                    </td>
                    <td className="pr-3">
                      <span className="pill bg-red-500/10 text-red-500">{reasonOf(deal)}</span>
                    </td>
                    <td className="max-w-[260px] truncate pr-3 text-mute">{deal.closeNote}</td>
                    <td className="pr-3 text-right">{formatINR(val(deal.id))}</td>
                    <td className="text-mute">{deal.closedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  )
}
