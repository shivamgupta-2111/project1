/** Dashboard. Reps see their own deals, tasks and target; Admin and CEO see the whole company. */
'use client'
import Link from 'next/link'
import { useState } from 'react'
import NewDeal from '@/components/NewDeal'
import QuickTask from '@/components/QuickTask'
import { useParams } from 'next/navigation'
import { Briefcase, IndianRupee, Clock, Trophy, Repeat } from 'lucide-react'
import Shell from '@/components/Shell'
import RepLink from '@/components/RepLink'
import { useStore } from '@/lib/store'
import { Role, Task } from '@/lib/types'
import { STAGES } from '@/lib/constants'
import { dealValue, isLost, isWon } from '@/lib/deals'
import { annualRecurringRevenue } from '@/lib/pricing'
import { formatINR } from '@/lib/format'
import { RISK_STYLES } from '@/lib/ui'

const MONTHS = [
  ['May', 4.2],
  ['Jun', 5.8],
  ['Jul', 5.1],
  ['Aug', 7.4],
  ['Sep', 6.9],
  ['Oct', 9.2],
] as [string, number][]

export default function Dash() {
  const role = useParams().role as Role
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const { deals, quotes, activity, tasks, payments, settings } = useStore()
  const [search, setSearch] = useState('')
  const mine = role === 'rep' ? deals.filter((deal) => deal.rep === myName) : deals
  const mq = quotes.filter((quote) => mine.some((deal) => deal.id === quote.dealId))
  const rows = mine.filter((deal) =>
    (deal.company + deal.client).toLowerCase().includes(search.toLowerCase()),
  )
  const pendingFor = quotes.filter(
    (quote) => quote.status === 'Pending approval' && (role === 'ceo' || quote.need === 'admin'),
  ).length
  const recent = activity
    .filter((entry) => mine.some((deal) => deal.id === entry.dealId))
    .slice(0, 6)
  const iso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
  const myTasks = role === 'rep' ? tasks.filter((task) => task.rep === myName) : tasks
  const dueToday = myTasks.filter((task) => !task.done && task.due === iso(0))
  const overdue = myTasks.filter((task) => !task.done && task.due < iso(0))
  const upcoming = myTasks
    .filter((task) => !task.done && task.due > iso(0) && task.due <= iso(7))
    .sort((a, task) => a.due.localeCompare(task.due))
  const closing = mine
    .filter((deal) => deal.stage < 4 && deal.target >= iso(0) && deal.target <= iso(14))
    .sort((a, deal) => a.target.localeCompare(deal.target))
  const top = mine
    .filter((deal) => deal.stage < 4)
    .sort((a, deal) => dealValue(quotes, deal.id) - dealValue(quotes, a.id))
    .slice(0, 5)
  const lost = mine.filter(isLost)
  const lostVal = lost.reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
  const arrWon = mine.filter(isWon).reduce((sum, deal) => {
    const f = quotes.find((quote) => quote.dealId === deal.id && quote.final)
    return sum + (f ? annualRecurringRevenue(f) : 0)
  }, 0)
  const payDue = payments
    .filter(
      (payment) =>
        payment.status === 'Due' &&
        payment.due <= iso(settings.remindDays ?? 7) &&
        mine.some((deal) => deal.id === payment.dealId),
    )
    .sort((a, payment) => a.due.localeCompare(payment.due))
  const trow = (task: Task) => (
    <li key={task.id} className="flex justify-between gap-3 text-sm">
      <Link href={`/${role}/deals/${task.dealId}`} className="min-w-0 hover:text-brand">
        <span className={task.due < iso(0) ? 'text-red-500' : ''}>{task.title}</span>
        <span className="block text-xs text-mute">
          {deals.find((deal) => deal.id === task.dealId)?.company}
        </span>
      </Link>
      <span className={`shrink-0 text-xs ${task.due < iso(0) ? 'text-red-500' : 'text-mute'}`}>
        {task.due}
      </span>
    </li>
  )
  const pipeline = mine
    .filter((deal) => deal.stage < 4)
    .reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
  const meU = useStore((state) => state.users.find((user) => user.id === state.meId))
  const wonVal = mine.filter(isWon).reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0)
  const pct = meU?.target ? Math.min(100, Math.round((wonVal / meU.target) * 100)) : 0
  const pending =
    role === 'rep'
      ? quotes.filter(
          (quote) =>
            quote.status === 'Pending approval' && mine.some((deal) => deal.id === quote.dealId),
        ).length
      : pendingFor
  const won = mine.filter(isWon)
  const stats = [
    { k: 'Open deals', v: mine.filter((deal) => deal.stage < 4).length, i: Briefcase },
    { k: 'Pipeline value', v: formatINR(pipeline), i: IndianRupee },
    { k: 'Pending approvals', v: pending, i: Clock },
    { k: 'Deals won', v: won.length, i: Trophy },
    { k: 'ARR (won)', v: formatINR(arrWon), i: Repeat },
  ]
  const max = Math.max(...MONTHS.map((m) => m[1]))
  const reps = [...new Set(deals.map((deal) => deal.rep))].map((n) => ({
    n,
    c: deals.filter((deal) => deal.rep === n).length,
    v: deals
      .filter((deal) => deal.rep === n)
      .reduce((sum, deal) => sum + dealValue(quotes, deal.id), 0),
  }))
  return (
    <Shell role={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {role === 'rep' ? 'Your pipeline' : 'Company overview'}
          </h1>
          <p className="text-sm text-mute">Here is what needs your attention today.</p>
        </div>
        <NewDeal role={role} />
      </div>
      {role !== 'rep' && pendingFor > 0 && (
        <Link
          href={`/${role}/approvals`}
          className="box mb-4 flex items-center justify-between border-brand/50 bg-brand/5 text-sm"
        >
          <span>
            <b>
              {pendingFor} quotation{pendingFor > 1 ? 's' : ''}
            </b>{' '}
            waiting for your approval
          </span>
          <span className="font-medium text-brand">Review →</span>
        </Link>
      )}
      {role === 'rep' && meU && (
        <Link href={`/${role}/profile`} className="box mb-4 block">
          <div className="flex justify-between text-sm">
            <span className="font-medium">My target progress</span>
            <span className="text-mute">
              {formatINR(wonVal)} of {formatINR(meU.target)} · {pct}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-line">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </Link>
      )}
      {dueToday.length + overdue.length > 0 && (
        <Link
          href={`/${role}/tasks`}
          className="box mb-4 flex items-center justify-between border-brand/50 bg-brand/5 text-sm"
        >
          <span>
            <b>
              {dueToday.length} task{dueToday.length === 1 ? '' : 's'} due today
            </b>
            {overdue.length > 0 && (
              <span className="text-red-500"> · {overdue.length} overdue</span>
            )}
          </span>
          <span className="font-medium text-brand">Open tasks →</span>
        </Link>
      )}
      {payDue.length > 0 && (
        <Link
          href={`/${role}/payments`}
          className="box mb-4 flex items-center justify-between border-brand/50 bg-brand/5 text-sm"
        >
          <span>
            <b>
              {payDue.length} payment reminder{payDue.length > 1 ? 's' : ''}
            </b>
            {payDue.some((payment) => payment.due < iso(0)) && (
              <span className="text-red-500">
                {' '}
                · {payDue.filter((payment) => payment.due < iso(0)).length} overdue
              </span>
            )}
          </span>
          <span className="font-medium text-brand">View payments →</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.k} className="box">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand">
              <s.i size={18} />
            </span>
            <p className="mt-3 text-sm text-mute">{s.k}</p>
            <p className="text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="box">
          <p className="mb-3 font-medium">
            Due today{' '}
            <span className="text-sm font-normal text-mute">
              ({dueToday.length + overdue.length})
            </span>
          </p>
          {dueToday.length + overdue.length === 0 ? (
            <p className="mb-3 text-sm text-mute">Nothing due today. Nice.</p>
          ) : (
            <ul className="mb-3 grid max-h-56 gap-3 overflow-y-auto scroll-y pr-1">
              {[...overdue, ...dueToday].map(trow)}
            </ul>
          )}
          <QuickTask role={role} />
        </div>
        <div className="box">
          <p className="mb-3 font-medium">
            Upcoming <span className="text-sm font-normal text-mute">next 7 days</span>
          </p>
          {upcoming.length === 0 && closing.length === 0 ? (
            <p className="text-sm text-mute">No upcoming tasks or deal dates.</p>
          ) : (
            <ul className="grid max-h-72 gap-3 overflow-y-auto scroll-y pr-1">
              {upcoming.map(trow)}
              {closing.map((deal) => (
                <li key={deal.id} className="flex justify-between gap-3 text-sm">
                  <Link href={`/${role}/deals/${deal.id}`} className="min-w-0 hover:text-brand">
                    Close target · {deal.company}
                    <span className="block text-xs text-mute">{deal.client}</span>
                  </Link>
                  <span className="shrink-0 text-xs text-mute">{deal.target}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="box">
          <p className="mb-3 font-medium">
            Top deals <span className="text-sm font-normal text-mute">most important</span>
          </p>
          <ul className="grid gap-3">
            {top.map((deal, index) => (
              <li key={deal.id} className="flex items-center justify-between gap-3 text-sm">
                <Link
                  href={`/${role}/deals/${deal.id}`}
                  className="flex min-w-0 items-center gap-3 hover:text-brand"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{deal.company}</span>
                    <span className="text-xs text-mute">
                      {STAGES[deal.stage]} · {deal.risk} risk
                    </span>
                  </span>
                </Link>
                <b className="shrink-0">{formatINR(dealValue(quotes, deal.id))}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="box">
          <p className="mb-3 font-medium text-red-500">
            Churn{' '}
            <span className="text-sm font-normal text-mute">
              {lost.length} lost · {formatINR(lostVal)}
            </span>
          </p>
          {lost.length === 0 ? (
            <p className="text-sm text-mute">No cancelled deals. 🎉</p>
          ) : (
            <ul className="grid max-h-56 gap-3 overflow-y-auto scroll-y pr-1">
              {lost.map((deal) => (
                <li key={deal.id} className="border-l-4 border-red-500 pl-3 text-sm">
                  <Link href={`/${role}/deals/${deal.id}`} className="font-medium hover:text-brand">
                    {deal.company}
                  </Link>
                  <span className="text-mute"> · {formatINR(dealValue(quotes, deal.id))}</span>
                  <p className="text-xs text-mute">
                    {deal.lostReason && <b className="text-red-500">{deal.lostReason} · </b>}
                    {deal.closeNote || 'No note added'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="box lg:col-span-2">
          <p className="mb-3 font-medium">
            Payment reminders{' '}
            <span className="text-sm font-normal text-mute">
              monthly and annual (ARR) subscriptions
            </span>
          </p>
          {payDue.length === 0 ? (
            <p className="text-sm text-mute">
              No payments due in the next {settings.remindDays ?? 7} days.
            </p>
          ) : (
            <ul className="grid max-h-56 gap-3 overflow-y-auto scroll-y pr-1">
              {payDue.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/${role}/payments`} className="min-w-0 hover:text-brand">
                    <span className="block truncate font-medium">
                      {deals.find((deal) => deal.id === payment.dealId)?.company}
                    </span>
                    <span className="text-xs text-mute">
                      {payment.kind} payment {payment.n} of {payment.of}
                    </span>
                  </Link>
                  <span className="shrink-0 text-right">
                    <b>{formatINR(payment.amount)}</b>
                    <span
                      className={`block text-xs ${payment.due < iso(0) ? 'text-red-500' : 'text-mute'}`}
                    >
                      {payment.due < iso(0) ? 'Overdue · ' : 'Due '}
                      {payment.due}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="box lg:col-span-2">
          <p className="font-medium">
            Revenue <span className="text-sm font-normal text-mute">· ₹ lakh, sample data</span>
          </p>
          <div className="mt-4 flex h-44 items-end gap-3">
            {MONTHS.map(([m, v]) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-brand/80 transition hover:bg-brand-dark"
                  style={{ height: `${(v / max) * 100}%` }}
                  title={`${v}L`}
                />
                <span className="text-xs text-mute">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="box">
          <p className="font-medium">Deals by stage</p>
          <div className="mt-4 grid gap-3">
            {STAGES.map((stage, index) => {
              const c = mine.filter((deal) => deal.stage === index).length
              return (
                <div key={stage}>
                  <div className="flex justify-between text-sm">
                    <span>{stage}</span>
                    <span className="text-mute">{c}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-line">
                    <div
                      className="h-2 rounded-full bg-brand"
                      style={{ width: `${(c / Math.max(mine.length, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="box mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Deals</p>
          <input
            className="inp max-w-xs"
            placeholder="Search company or client"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setSearch('')}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-mute">
              <tr>
                <th className="pb-2 font-medium">Company</th>
                <th className="font-medium">Rep</th>
                <th className="font-medium">Stage</th>
                <th className="font-medium">Amount</th>
                <th className="font-medium">Risk</th>
                <th className="font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((deal) => (
                <tr key={deal.id} className="border-t border-line">
                  <td className="py-3">
                    <Link
                      className="font-medium hover:text-brand"
                      href={`/${role}/deals/${deal.id}`}
                    >
                      {deal.company}
                    </Link>
                    <p className="text-xs text-mute">{deal.client}</p>
                  </td>
                  <td>
                    <RepLink name={deal.rep} />
                  </td>
                  <td>
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
                  <td>{formatINR(dealValue(quotes, deal.id))}</td>
                  <td>
                    <span className={`pill ${RISK_STYLES[deal.risk]}`}>{deal.risk}</span>
                  </td>
                  <td className="text-mute">{deal.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-mute">No deals match your search.</p>
          )}
        </div>
      </div>
      <div className="box mt-4">
        <p className="mb-3 font-medium">Recent activity</p>
        <ul className="grid gap-3">
          {recent.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3 text-sm">
              <span>
                <b>{deals.find((deal) => deal.id === entry.dealId)?.company}</b> · {entry.text}
              </span>
              <span className="shrink-0 text-xs text-mute">
                {new Date(entry.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {role !== 'rep' && (
        <div className="box mt-4">
          <p className="mb-3 font-medium">Rep leaderboard</p>
          <ul className="grid gap-3">
            {reps
              .sort((a, b) => b.v - a.v)
              .map((x, index) => (
                <li key={x.n} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                      {index + 1}
                    </span>
                    <RepLink name={x.n} />
                    <span className="text-mute">{x.c} deals</span>
                  </span>
                  <b>{formatINR(x.v)}</b>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Shell>
  )
}
