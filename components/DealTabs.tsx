/** Tabs under a deal: call and meeting log, activity, tasks and social accounts. */
'use client'
import { useState } from 'react'
import { Trash2, Phone, Users, Mail, StickyNote, CalendarClock } from 'lucide-react'
import { useStore } from '@/lib/store'
import RepLink from '@/components/RepLink'
import { toast } from '@/components/Toaster'
import QuickTask from '@/components/QuickTask'
import { OUTCOMES, PLATFORMS } from '@/lib/constants'
import { Rec } from '@/lib/types'

const fmt = (s: string) =>
  new Date(s).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
const ICON = { Call: Phone, Meeting: Users, Email: Mail, Note: StickyNote }
const OC: Record<string, string> = {
  Interested: 'bg-green-500/15 text-green-600',
  'Deal progressed': 'bg-green-500/15 text-green-600',
  'Needs follow-up': 'bg-amber-500/15 text-amber-600',
  'Not interested': 'bg-red-500/15 text-red-500',
  'No answer': 'bg-slate-500/15 text-slate-500',
  'Left voicemail': 'bg-slate-500/15 text-slate-500',
}
const localNow = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}
export default function DealTabs({ dealId, who }: { dealId: string; who: string }) {
  const {
    activity,
    records,
    socials,
    contacts,
    deals,
    addRecord,
    addSocial,
    removeSocial,
    tasks,
    toggleTask,
  } = useStore()
  const tl = tasks.filter((task) => task.dealId === dealId)
  const [tab, setTab] = useState<'Activity' | 'Call log' | 'Tasks' | 'Social media'>('Call log')
  const d = deals.find((deal) => deal.id === dealId)
  const names = [
    ...new Set(
      [
        d?.client || '',
        ...contacts.filter((contact) => contact.dealId === dealId).map((contact) => contact.name),
      ].filter(Boolean),
    ),
  ]
  const blank = {
    type: 'Call' as Rec['type'],
    contact: '',
    when: localNow(),
    duration: '',
    outcome: 'Needs follow-up',
    text: '',
    next: '',
    nextDue: '',
  }
  const [form, setForm] = useState(blank)
  const [typeFilter, setTypeFilter] = useState<'All' | Rec['type']>('All')
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [handle, setHandle] = useState('')
  const acts = activity.filter((entry) => entry.dealId === dealId)
  const soc = socials.filter((account) => account.dealId === dealId)
  const recs = records
    .filter((record) => record.dealId === dealId)
    .sort((a, record) => record.at.localeCompare(a.at))
  const shown = recs.filter((record) => typeFilter === 'All' || record.type === typeFilter)
  const talk = form.type === 'Call' || form.type === 'Meeting'
  const last = recs.find((record) => record.type !== 'Note')
  const save = () => {
    addRecord(dealId, form.type, form.text.trim(), who, {
      at: new Date(form.when || Date.now()).toISOString(),
      contact: form.contact || names[0],
      duration: talk && form.duration ? Number(form.duration) : undefined,
      outcome: talk ? form.outcome : undefined,
      next: form.next.trim() || undefined,
      nextDue: form.next.trim() && form.nextDue ? form.nextDue : undefined,
    })
    toast(
      form.next.trim() && form.nextDue
        ? `${form.type} logged · follow-up set for ${form.nextDue}`
        : `${form.type} logged`,
    )
    setForm({ ...blank, when: localNow() })
  }
  return (
    <div className="box mt-4">
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {(['Call log', 'Activity', 'Tasks', 'Social media'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-brand text-brand' : 'border-transparent text-mute'}`}
          >
            {t === 'Call log' ? 'Call & meeting log' : t}
            {t === 'Call log' && recs.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 text-[11px] text-brand">
                {recs.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === 'Activity' &&
        (acts.length === 0 ? (
          <p className="text-sm text-mute">
            No activity yet. Stage changes, quotes and records show up here.
          </p>
        ) : (
          <ul className="grid max-h-72 gap-3 overflow-y-auto scroll-y pr-1">
            {acts.map((entry) => (
              <li key={entry.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {entry.text}
                  {entry.by && <span className="text-xs text-mute"> · {entry.by}</span>}
                </span>
                <span className="shrink-0 text-xs text-mute">{fmt(entry.at)}</span>
              </li>
            ))}
          </ul>
        ))}
      {tab === 'Call log' && (
        <>
          <div className="mb-4 grid gap-3 rounded-lg border border-line bg-ink/[0.02] p-3">
            <div className="grid gap-2 md:grid-cols-4">
              <label className="grid gap-1 text-xs font-medium text-mute">
                Type
                <select
                  className="inp"
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value as Rec['type'] })
                  }
                >
                  {['Call', 'Meeting', 'Email', 'Note'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-mute">
                With
                <select
                  className="inp"
                  value={form.contact || names[0] || ''}
                  onChange={(event) => setForm({ ...form, contact: event.target.value })}
                >
                  {names.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-mute">
                When
                <input
                  type="datetime-local"
                  max={localNow()}
                  className="inp"
                  value={form.when}
                  onChange={(event) => setForm({ ...form, when: event.target.value })}
                />
              </label>
              {talk && (
                <label className="grid gap-1 text-xs font-medium text-mute">
                  Duration (minutes)
                  <input
                    type="number"
                    min={1}
                    className="inp"
                    placeholder="e.g. 15"
                    value={form.duration}
                    onChange={(event) => setForm({ ...form, duration: event.target.value })}
                  />
                </label>
              )}
            </div>
            {talk && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-mute">Outcome</span>
                {OUTCOMES.map((outcome) => (
                  <button
                    key={outcome}
                    onClick={() => setForm({ ...form, outcome })}
                    className={`rounded-lg border px-2.5 py-1 text-xs ${form.outcome === outcome ? 'border-brand bg-brand/10 text-brand' : 'border-line text-mute hover:bg-ink/5'}`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            )}
            <label className="grid gap-1 text-xs font-medium text-mute">
              {form.type === 'Note' ? 'Note' : 'What was discussed?'}
              <textarea
                rows={2}
                className="inp"
                placeholder="Key points, objections, decisions…"
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
              />
            </label>
            <div className="grid gap-2 md:grid-cols-[1fr_170px_auto] md:items-end">
              <label className="grid gap-1 text-xs font-medium text-mute">
                Next step (optional)
                <input
                  className="inp"
                  placeholder="e.g. Send revised quote"
                  value={form.next}
                  onChange={(event) => setForm({ ...form, next: event.target.value })}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-mute">
                Next step date
                <input
                  type="date"
                  className="inp"
                  disabled={!form.next.trim()}
                  value={form.nextDue}
                  onChange={(event) => setForm({ ...form, nextDue: event.target.value })}
                />
              </label>
              <button className="btn" disabled={!form.text.trim()} onClick={save}>
                Log {form.type.toLowerCase()}
              </button>
            </div>
            {form.next.trim() && form.nextDue && (
              <p className="text-xs text-mute">
                A follow-up reminder will be created for {form.nextDue}.
              </p>
            )}
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Call', 'Meeting', 'Email', 'Note'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${typeFilter === t ? 'border-brand bg-brand/10 text-brand' : 'border-line text-mute'}`}
                >
                  {t === 'All'
                    ? `All (${recs.length})`
                    : `${t}s (${recs.filter((record) => record.type === t).length})`}
                </button>
              ))}
            </div>
            <span className="text-xs text-mute">
              {last ? `Last contact ${ago(last.at)}` : 'No contact logged yet'}
            </span>
          </div>
          {shown.length === 0 ? (
            <p className="text-sm text-mute">
              Nothing logged yet. Record every call and meeting so the whole team knows where this
              deal stands.
            </p>
          ) : (
            <ul className="grid max-h-96 gap-3 overflow-y-auto scroll-y pr-1">
              {shown.map((record) => {
                const I = ICON[record.type]
                return (
                  <li key={record.id} className="rounded-lg border border-line p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-brand/10 text-brand">
                          <I size={14} />
                        </span>
                        <b>{record.type}</b>
                        {record.contact && <span className="text-mute">with {record.contact}</span>}
                        {record.duration ? (
                          <span className="text-xs text-mute">· {record.duration} min</span>
                        ) : null}
                        {record.outcome && (
                          <span
                            className={`pill ${OC[record.outcome] || 'bg-slate-500/15 text-slate-500'}`}
                          >
                            {record.outcome}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-mute">
                        {fmt(record.at)} · <RepLink name={record.by} />
                      </span>
                    </div>
                    <p className="mt-2">{record.text}</p>
                    {record.next && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-mute">
                        <CalendarClock size={13} className="text-brand" />
                        Next: {record.next}
                        {record.nextDue && ` · ${record.nextDue}`}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
      {tab === 'Tasks' && (
        <>
          <div className="mb-4">
            <QuickTask dealId={dealId} />
          </div>
          {tl.length === 0 ? (
            <p className="text-sm text-mute">No tasks for this deal yet.</p>
          ) : (
            <ul className="grid max-h-72 gap-2 overflow-y-auto scroll-y pr-1">
              {tl.map((task) => (
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
                  <span className={task.done ? 'text-mute line-through' : ''}>{task.title}</span>
                  {task.kind === 'followup' && (
                    <span className="pill bg-brand/10 text-brand">Follow-up</span>
                  )}
                  <span className="ml-auto text-xs text-mute">{task.due}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {tab === 'Social media' && (
        <>
          <div className="mb-4 grid gap-2 md:grid-cols-[160px_1fr_auto]">
            <select
              className="inp"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              {PLATFORMS.map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
            <input
              className="inp"
              placeholder="Handle or link"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
            />
            <button
              className="btn"
              disabled={!handle.trim()}
              onClick={() => {
                addSocial(dealId, platform, handle.trim())
                setHandle('')
              }}
            >
              Add account
            </button>
          </div>
          {soc.length === 0 ? (
            <p className="text-sm text-mute">
              No accounts added. Add the client’s LinkedIn, Instagram or website.
            </p>
          ) : (
            <ul className="grid max-h-72 gap-2 overflow-y-auto scroll-y pr-1">
              {soc.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"
                >
                  <span>
                    <b>{account.platform}</b> ·{' '}
                    {account.handle.startsWith('http') ? (
                      <a
                        className="text-brand underline"
                        href={account.handle}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {account.handle}
                      </a>
                    ) : (
                      account.handle
                    )}
                  </span>
                  <button
                    aria-label="Remove"
                    onClick={() => removeSocial(account.id)}
                    className="text-mute"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
