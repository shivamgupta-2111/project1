/** One rep's full profile (Admin and CEO): overview, deals, calls, tasks, activity, details. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Phone, Mail, MapPin, Target, AlertTriangle } from 'lucide-react'
import Shell from '@/components/Shell'
import RepProgress from '@/components/RepProgress'
import Avatar from '@/components/Avatar'
import { dueLabel } from '@/components/FollowUp'
import { useStore } from '@/lib/store'
import { Deal, Role } from '@/lib/types'
import { STAGES } from '@/lib/constants'
import { dealValue, isLost, isWon } from '@/lib/deals'
import { formatINR } from '@/lib/format'
import { RISK_STYLES } from '@/lib/ui'

const COLS = ['Discover', 'Identify', 'Next', 'Proposal', 'Closed · Done', 'Cancelled']
const colOf = (deal: Deal) => (deal.stage < 4 ? deal.stage : deal.outcome === 'Cancelled' ? 5 : 4)
const fmt = (s: string) =>
  new Date(s).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
const TABS = ['Overview', 'Deals', 'Calls & meetings', 'Tasks', 'Activity', 'Profile'] as const
export default function RepDetail() {
  const { role: r, id } = useParams() as { role: Role; id: string }
  const { users, deals, quotes, tasks, records, activity, payments } = useStore()
  const u = users.find((user) => user.id === id && user.role === 'rep')
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  if (r === 'rep')
    return (
      <Shell role={r}>
        <p className="box text-sm text-mute">Not available.</p>
      </Shell>
    )
  if (!u)
    return (
      <Shell role={r}>
        <Link href={`/${r}/team`} className="text-sm text-mute hover:text-brand">
          ← Team
        </Link>
        <p className="box mt-3 text-sm text-mute">Rep not found.</p>
      </Shell>
    )
  const iso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
  const today = iso(0)
  const mine = deals.filter((deal) => deal.rep === u.name)
  const open = mine.filter((deal) => deal.stage < 4)
  const val = (deal: Deal) => dealValue(quotes, deal.id)
  const co = (id: string) => deals.find((deal) => deal.id === id)?.company || '—'
  const tk = tasks.filter((task) => task.rep === u.name)
  const rec = records
    .filter((record) => record.by === u.name)
    .sort((a, record) => record.at.localeCompare(a.at))
  const act = activity
    .filter((entry) => entry.by === u.name)
    .sort((a, entry) => entry.at.localeCompare(a.at))
  const lastRec = (id: string) =>
    records
      .filter((record) => record.dealId === id && record.type !== 'Note')
      .sort((a, record) => record.at.localeCompare(a.at))[0]?.at
  const overdue = tk.filter((task) => !task.done && task.due < today)
  const pastTarget = open.filter((deal) => deal.target < today)
  const pendingQ = quotes.filter(
    (quote) => quote.status === 'Pending approval' && mine.some((deal) => deal.id === quote.dealId),
  )
  const payLate = payments.filter(
    (payment) =>
      payment.status === 'Due' &&
      payment.due < today &&
      mine.some((deal) => deal.id === payment.dealId),
  )
  const quiet = open.filter((deal) => {
    const l = lastRec(deal.id)
    return !l || l < new Date(Date.now() - 14 * 864e5).toISOString()
  })
  const m30 = rec.filter((record) => record.at >= new Date(Date.now() - 30 * 864e5).toISOString())
  const calls = m30.filter((record) => record.type === 'Call')
  const meets = m30.filter((record) => record.type === 'Meeting')
  const flags: [string, number, string][] = [
    ['Overdue tasks', overdue.length, 'tasks'],
    ['Open deals past target date', pastTarget.length, 'deals'],
    ['Quotes waiting for approval', pendingQ.length, 'deals'],
    ['Overdue payments', payLate.length, 'deals'],
    ['Open deals with no contact in 14 days', quiet.length, 'deals'],
  ]
  const dealRow = (deal: Deal) => (
    <tr key={deal.id} className="border-t border-line">
      <td className="py-2.5 pr-3">
        <Link href={`/${r}/deals/${deal.id}`} className="font-medium hover:text-brand">
          {deal.company}
        </Link>
        <p className="text-xs text-mute">{deal.client}</p>
      </td>
      <td className="pr-3">
        <span
          className={`pill ${deal.stage === 4 ? (deal.outcome === 'Cancelled' ? 'bg-red-500/15 text-red-500' : 'bg-green-500/15 text-green-600') : 'bg-brand/10 text-brand'}`}
        >
          {deal.stage === 4
            ? deal.outcome === 'Cancelled'
              ? 'Cancelled'
              : 'Won'
            : STAGES[deal.stage]}
        </span>
      </td>
      <td className="pr-3">{formatINR(val(deal))}</td>
      <td className="pr-3">
        <span className={`pill ${RISK_STYLES[deal.risk]}`}>{deal.risk}</span>
      </td>
      <td className="pr-3 text-mute">{deal.target}</td>
      <td className="text-mute">
        {deal.lostReason ??
          (deal.stage < 4 && lastRec(deal.id)
            ? `Contact ${Math.floor((Date.now() - new Date(lastRec(deal.id)!).getTime()) / 864e5)}d ago`
            : '')}
      </td>
    </tr>
  )
  return (
    <Shell role={r}>
      <Link href={`/${r}/team`} className="text-sm text-mute hover:text-brand">
        ← Team
      </Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={u.name} photo={u.photo} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">{u.name}</h1>
            <p className="text-sm text-mute">Sales rep{u.city && ` · ${u.city}`}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {u.phone && (
            <a className="btn2 flex items-center gap-2" href={`tel:${u.phone}`}>
              <Phone size={15} />
              {u.phone}
            </a>
          )}
          <a className="btn2 flex items-center gap-2" href={`mailto:${u.email}`}>
            <Mail size={15} />
            {u.email}
          </a>
          {u.city && (
            <span className="btn2 flex items-center gap-2 !cursor-default hover:!bg-transparent">
              <MapPin size={15} />
              {u.city}
            </span>
          )}
          <span className="btn2 flex items-center gap-2 !cursor-default hover:!bg-transparent">
            <Target size={15} />
            Target {formatINR(u.target)}
          </span>
        </div>
      </div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-brand text-brand' : 'border-transparent text-mute'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <>
          <RepProgress key={u.id} user={u} manager details={false} />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="box">
              <p className="mb-3 font-medium">Needs attention</p>
              <ul className="grid gap-2 text-sm">
                {flags.map(([l, n]) => (
                  <li key={l} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {n > 0 && <AlertTriangle size={14} className="text-amber-600" />}
                      {l}
                    </span>
                    <span
                      className={`pill ${n > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-green-500/15 text-green-600'}`}
                    >
                      {n}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="box">
              <p className="mb-3 font-medium">Deals by stage</p>
              <div className="grid gap-3">
                {COLS.map((column, index) => {
                  const n = mine.filter((deal) => colOf(deal) === index).length
                  return (
                    <div key={column}>
                      <div className="flex justify-between text-sm">
                        <span>{column}</span>
                        <span className="text-mute">{n}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-line">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${(n / Math.max(1, mine.length)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="box">
              <p className="mb-3 font-medium">Last 30 days</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold">{calls.length}</p>
                  <p className="text-xs text-mute">Calls</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{meets.length}</p>
                  <p className="text-xs text-mute">Meetings</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {formatINR(
                      mine
                        .filter(isWon)
                        .filter((deal) => (deal.closedAt ?? '') >= iso(-30))
                        .reduce((sum, deal) => sum + val(deal), 0),
                    )}
                  </p>
                  <p className="text-xs text-mute">Won</p>
                </div>
              </div>
            </div>
            <div className="box">
              <p className="mb-3 font-medium">Recent activity</p>
              {act.length === 0 ? (
                <p className="text-sm text-mute">No recorded activity yet.</p>
              ) : (
                <ul className="grid gap-2 text-sm">
                  {act.slice(0, 5).map((entry) => (
                    <li key={entry.id} className="flex justify-between gap-3">
                      <span className="min-w-0">
                        {entry.text}
                        <span className="block text-xs text-mute">{co(entry.dealId)}</span>
                      </span>
                      <span className="shrink-0 text-xs text-mute">{fmt(entry.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'Deals' && (
        <div className="box overflow-x-auto">
          <p className="mb-3 font-medium">
            {mine.length} deals{' '}
            <span className="text-sm font-normal text-mute">
              · {formatINR(open.reduce((sum, deal) => sum + val(deal), 0))} open ·{' '}
              {formatINR(mine.filter(isWon).reduce((sum, deal) => sum + val(deal), 0))} won ·{' '}
              {mine.filter(isLost).length} lost
            </span>
          </p>
          {mine.length === 0 ? (
            <p className="text-sm text-mute">No deals assigned.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-2 pr-3">Deal</th>
                  <th className="pr-3">Status</th>
                  <th className="pr-3">Value</th>
                  <th className="pr-3">Risk</th>
                  <th className="pr-3">Target</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>{[...open, ...mine.filter((deal) => deal.stage === 4)].map(dealRow)}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Calls & meetings' && (
        <div className="box">
          <p className="mb-1 font-medium">Calls and meetings</p>
          <p className="mb-4 text-xs text-mute">
            {calls.length} calls and {meets.length} meetings in the last 30 days · {rec.length}{' '}
            entries in total
          </p>
          {rec.length === 0 ? (
            <p className="text-sm text-mute">{u.name} hasn’t logged any calls or meetings yet.</p>
          ) : (
            <ul className="grid gap-3">
              {rec.slice(0, 40).map((record) => (
                <li key={record.id} className="rounded-lg border border-line p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <b>{record.type}</b>
                      {record.contact && <span className="text-mute">with {record.contact}</span>}
                      {record.duration ? (
                        <span className="text-xs text-mute">· {record.duration} min</span>
                      ) : null}
                      {record.outcome && (
                        <span className="pill bg-brand/10 text-brand">{record.outcome}</span>
                      )}
                    </span>
                    <span className="text-xs text-mute">{fmt(record.at)}</span>
                  </div>
                  <Link
                    href={`/${r}/deals/${record.dealId}`}
                    className="mt-1 block text-xs text-mute hover:text-brand"
                  >
                    {co(record.dealId)}
                  </Link>
                  <p className="mt-1">{record.text}</p>
                  {record.next && (
                    <p className="mt-1 text-xs text-mute">
                      Next: {record.next}
                      {record.nextDue && ` · ${record.nextDue}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              ['Overdue', tk.filter((task) => !task.done && task.due < today), 'text-red-500'],
              ['Today', tk.filter((task) => !task.done && task.due === today), 'text-brand'],
              ['Upcoming', tk.filter((task) => !task.done && task.due > today), 'text-ink'],
              ['Done', tk.filter((task) => task.done), 'text-mute'],
            ] as const
          ).map(([n, list, c]) => (
            <div key={n} className="box">
              <p className={`mb-3 font-medium ${c}`}>
                {n} <span className="text-sm font-normal text-mute">({list.length})</span>
              </p>
              {list.length === 0 ? (
                <p className="text-sm text-mute">Nothing here.</p>
              ) : (
                <ul className="grid gap-2">
                  {list.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/${r}/deals/${task.dealId}`}
                        className="min-w-0 hover:text-brand"
                      >
                        <span className="block truncate">
                          {task.title}
                          {task.kind === 'followup' && (
                            <span className="pill ml-2 bg-brand/10 text-brand">Follow-up</span>
                          )}
                        </span>
                        <span className="text-xs text-mute">{co(task.dealId)}</span>
                      </Link>
                      <span
                        className={`shrink-0 text-xs ${task.done ? 'text-mute' : dueLabel(task.due)[1]}`}
                      >
                        {task.done ? task.due : dueLabel(task.due)[0]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Activity' && (
        <div className="box overflow-x-auto">
          <p className="mb-3 font-medium">
            Everything {u.name} has done{' '}
            <span className="text-sm font-normal text-mute">({act.length})</span>
          </p>
          {act.length === 0 ? (
            <p className="text-sm text-mute">No recorded activity yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pr-4">Deal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {act.slice(0, 100).map((entry) => (
                  <tr key={entry.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap py-2 pr-4 text-xs text-mute">
                      {fmt(entry.at)}
                    </td>
                    <td className="pr-4">
                      {entry.dealId ? (
                        <Link href={`/${r}/deals/${entry.dealId}`} className="hover:text-brand">
                          {co(entry.dealId)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{entry.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Profile' && <RepProgress key={u.id} user={u} manager progress={false} />}
    </Shell>
  )
}
