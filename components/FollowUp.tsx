/** Follow-up reminder card on a deal, with quick dates and snooze. */
'use client'
import { useState } from 'react'
import { BellRing, Check, Clock } from 'lucide-react'
import { useStore } from '@/lib/store'
import { toast } from '@/components/Toaster'
const iso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const QUICK: [string, number][] = [
  ['Tomorrow', 1],
  ['In 3 days', 3],
  ['Next week', 7],
  ['In 2 weeks', 14],
  ['In a month', 30],
]
const nice = (d: string) =>
  new Date(d + 'T00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
export function dueLabel(d: string) {
  const diff = Math.round(
    (new Date(d + 'T00:00').getTime() - new Date(iso(0) + 'T00:00').getTime()) / 864e5,
  )
  return diff < 0
    ? [`Overdue by ${-diff} day${diff === -1 ? '' : 's'}`, 'text-red-500']
    : diff === 0
      ? ['Due today', 'text-brand']
      : diff === 1
        ? ['Tomorrow', 'text-ink']
        : [`In ${diff} days`, 'text-mute']
}
export default function FollowUp({ dealId }: { dealId: string }) {
  const { tasks, deals, addFollowUp, snoozeTask, toggleTask } = useStore()
  const d = deals.find((deal) => deal.id === dealId)!
  const [due, setDue] = useState(iso(3))
  const [note, setNote] = useState('')
  const pending = tasks
    .filter((task) => task.dealId === dealId && task.kind === 'followup' && !task.done)
    .sort((a, task) => a.due.localeCompare(task.due))
  return (
    <div className="box mt-4">
      <div className="mb-3 flex items-center gap-2">
        <BellRing size={18} className="text-brand" />
        <p className="font-medium">Follow-up reminder</p>
      </div>
      <p className="mb-3 text-xs text-mute">
        Pick when to follow up with {d.client}. You’ll get a notification that day and it appears in
        your tasks.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map(([l, n]) => (
          <button
            key={l}
            onClick={() => setDue(iso(n))}
            className={`rounded-lg border px-3 py-1.5 text-xs ${due === iso(n) ? 'border-brand bg-brand/10 text-brand' : 'border-line text-mute hover:bg-ink/5'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-[170px_1fr_auto]">
        <input
          type="date"
          min={iso(0)}
          className="inp"
          aria-label="Follow-up date"
          value={due}
          onChange={(event) => setDue(event.target.value)}
        />
        <input
          className="inp"
          placeholder={`What to follow up on? (default: Follow up with ${d.client})`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && due) {
              addFollowUp(dealId, due, note)
              setNote('')
              toast(`Reminder set for ${nice(due)}`)
            }
          }}
        />
        <button
          className="btn"
          disabled={!due}
          onClick={() => {
            addFollowUp(dealId, due, note)
            setNote('')
            toast(`Reminder set for ${nice(due)}`)
          }}
        >
          Set reminder
        </button>
      </div>
      {pending.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {pending.map((task) => {
            const [l, c] = dueLabel(task.due)
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{task.title}</span>
                  <span className={`text-xs ${c}`}>
                    {l} · {nice(task.due)}
                  </span>
                </span>
                <button
                  className="btn2 flex items-center gap-1 !px-2.5 !py-1 text-xs"
                  title="Push back one day"
                  onClick={() => {
                    snoozeTask(task.id, 1)
                    toast('Snoozed for a day')
                  }}
                >
                  <Clock size={13} />
                  Snooze 1 day
                </button>
                <button
                  className="btn2 flex items-center gap-1 !px-2.5 !py-1 text-xs"
                  onClick={() => {
                    toggleTask(task.id)
                    toast('Follow-up done')
                  }}
                >
                  <Check size={13} />
                  Done
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
