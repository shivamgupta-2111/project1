/** Tasks and follow-ups, grouped by overdue, today and upcoming. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Shell from '@/components/Shell'
import { toast } from '@/components/Toaster'
import RepLink from '@/components/RepLink'
import { dueLabel } from '@/components/FollowUp'
import { useStore } from '@/lib/store'
import { Role, Task } from '@/lib/types'

export default function Tasks() {
  const role = useParams().role as Role
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const { tasks, deals, addTask, toggleTask, deleteTask, snoozeTask } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const mineDeals = role === 'rep' ? deals.filter((deal) => deal.rep === myName) : deals
  const [form, setForm] = useState({ title: '', dealId: '', due: today })
  const mine = role === 'rep' ? tasks.filter((task) => task.rep === myName) : tasks
  const groups: [string, Task[], string][] = [
    ['Overdue', mine.filter((task) => !task.done && task.due < today), 'text-red-500'],
    ['Today', mine.filter((task) => !task.done && task.due === today), 'text-brand'],
    ['Upcoming', mine.filter((task) => !task.done && task.due > today), 'text-ink'],
    ['Done', mine.filter((task) => task.done), 'text-mute'],
  ]
  const add = () => {
    const d = deals.find((deal) => deal.id === (form.dealId || mineDeals[0]?.id))
    if (!d) return
    addTask({ title: form.title.trim(), dealId: d.id, due: form.due, rep: d.rep })
    setForm({ ...form, title: '' })
    toast('Task added')
  }
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Tasks and reminders</h1>
      <p className="mb-6 text-sm text-mute">Never miss a follow-up.</p>
      <div className="box grid gap-2 md:grid-cols-[1fr_200px_150px_auto]">
        <input
          className="inp"
          placeholder="New task, e.g. Call client"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <select
          className="inp"
          value={form.dealId}
          onChange={(event) => setForm({ ...form, dealId: event.target.value })}
        >
          {mineDeals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.company}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="inp"
          value={form.due}
          onChange={(event) => setForm({ ...form, due: event.target.value })}
        />
        <button className="btn" disabled={!form.title.trim()} onClick={add}>
          Add task
        </button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map(([name, list, c]) => (
          <div key={name} className="box">
            <p className={`mb-3 font-medium ${c}`}>
              {name} <span className="text-sm font-normal text-mute">({list.length})</span>
            </p>
            {list.length === 0 ? (
              <p className="text-sm text-mute">Nothing here.</p>
            ) : (
              <ul className="grid gap-2">
                {list.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#e87722]"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      aria-label="Mark done"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={task.done ? 'line-through text-mute' : ''}>
                        {task.title}
                      </span>
                      {task.kind === 'followup' && (
                        <span className="pill ml-2 bg-brand/10 text-brand">Follow-up</span>
                      )}
                      <Link
                        href={`/${role}/deals/${task.dealId}`}
                        className="block text-xs text-mute hover:text-brand"
                      >
                        {deals.find((deal) => deal.id === task.dealId)?.company} · {task.due}
                        {!task.done && task.kind === 'followup' && ` · ${dueLabel(task.due)[0]}`}
                      </Link>
                      {role !== 'rep' && (
                        <span className="block text-xs text-mute">
                          Rep: <RepLink name={task.rep} />
                        </span>
                      )}
                    </span>
                    {!task.done && task.kind === 'followup' && (
                      <button
                        className="btn2 !px-2 !py-1 text-xs"
                        title="Push back one day"
                        onClick={() => {
                          snoozeTask(task.id, 1)
                          toast('Snoozed for a day')
                        }}
                      >
                        Snooze
                      </button>
                    )}
                    <button aria-label="Delete" onClick={() => deleteTask(task.id)}>
                      <Trash2 size={16} className="text-mute" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Shell>
  )
}
