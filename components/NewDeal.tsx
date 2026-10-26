/** "New deal" button and dialog, including the duplicate check. */
'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, AlertTriangle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { findDupes, GST_RE } from '@/lib/dupes'
import { toast } from '@/components/Toaster'
import { useEsc } from '@/components/useEsc'
import { Role } from '@/lib/types'
import { STAGES } from '@/lib/constants'

export default function NewDeal({ role }: { role: Role }) {
  const { addDeal, logActivity, deals, users } = useStore()
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const reps = users.filter((user) => user.role === 'rep')
  const r = useRouter()
  const [open, setOpen] = useState(false)
  useEsc(open, () => setOpen(false))
  const [form, setForm] = useState({
    company: '',
    client: '',
    gst: '',
    target: '',
    rep: '',
    risk: 'Low' as 'Low' | 'Medium' | 'High',
  })
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false)
  const dupes = useMemo(
    () => findDupes(deals, { company: form.company, gst: form.gst }),
    [deals, form.company, form.gst],
  )
  const gstBad = form.gst.length > 0 && !GST_RE.test(form.gst)
  const save = () => {
    const id = addDeal({
      company: form.company,
      client: form.client,
      gst: form.gst,
      target: form.target,
      risk: form.risk,
      rep: role === 'rep' ? myName || '' : form.rep || reps[0]?.name || '',
      notes: '',
    })
    if (dupes.length)
      logActivity(
        id,
        `Created although it may duplicate ${dupes.map((x) => x.deal.id).join(', ')} (${dupes[0].reason.toLowerCase()})`,
      )
    toast('Deal created')
    setOpen(false)
    setConfirmedDuplicate(false)
    setForm({ company: '', client: '', gst: '', target: '', rep: '', risk: 'Low' })
    r.push(`/${role}/deals/${id}`)
  }
  return (
    <>
      <button className="btn flex items-center gap-1" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New deal
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-[#0a0f1a]/55 p-0 md:place-items-center md:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="New deal"
            className="w-full max-w-md rounded-t-xl glass-dialog p-6 md:rounded-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">New deal</p>
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3">
              <input
                autoFocus
                className="inp"
                placeholder="Company name"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
              />
              <input
                className="inp"
                placeholder="Client name"
                value={form.client}
                onChange={(event) => setForm({ ...form, client: event.target.value })}
              />
              <input
                className="inp"
                placeholder="GST number (optional)"
                maxLength={15}
                value={form.gst}
                onChange={(event) => setForm({ ...form, gst: event.target.value.toUpperCase() })}
              />
              {gstBad && (
                <p className="-mt-1 text-xs text-amber-600">
                  GST should be 15 characters, like 27AAAAA0000A1Z5. You can still save it.
                </p>
              )}
              {dupes.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
                >
                  <p className="flex items-center gap-2 font-medium text-amber-600">
                    <AlertTriangle size={16} />
                    Possible duplicate{dupes.length > 1 ? 's' : ''} found
                  </p>
                  <ul className="mt-2 grid gap-2">
                    {dupes.map((x) => (
                      <li
                        key={x.deal.id}
                        className="flex items-start justify-between gap-3 rounded-md bg-card/60 p-2"
                      >
                        <span className="min-w-0">
                          <b className="block truncate">{x.deal.company}</b>
                          <span className="block text-xs text-mute">
                            {x.deal.client} · Owner: {x.deal.rep} ·{' '}
                            {x.deal.stage === 4
                              ? x.deal.outcome === 'Cancelled'
                                ? 'Cancelled'
                                : 'Won'
                              : STAGES[x.deal.stage]}
                          </span>
                          <span
                            className={`pill mt-1 inline-block ${x.strong ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-600'}`}
                          >
                            {x.reason}
                          </span>
                        </span>
                        <a
                          href={`/${role}/deals/${x.deal.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-xs text-brand underline"
                        >
                          Open
                        </a>
                      </li>
                    ))}
                  </ul>
                  <label className="mt-3 flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[#e87722]"
                      checked={confirmedDuplicate}
                      onChange={(event) => setConfirmedDuplicate(event.target.checked)}
                    />
                    This is a different client. Create it anyway.
                  </label>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="inp"
                  value={form.target}
                  onChange={(event) => setForm({ ...form, target: event.target.value })}
                  aria-label="Target date"
                />
                <select
                  className="inp"
                  value={form.risk}
                  onChange={(event) => setForm({ ...form, risk: event.target.value as 'Low' })}
                >
                  {['Low', 'Medium', 'High'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              {role !== 'rep' && (
                <label className="grid gap-1 text-sm">
                  Assign to rep
                  <select
                    className="inp"
                    value={form.rep || reps[0]?.name}
                    onChange={(event) => setForm({ ...form, rep: event.target.value })}
                  >
                    {reps.map((user) => (
                      <option key={user.id}>{user.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="btn"
                disabled={
                  !form.company.trim() ||
                  !form.client.trim() ||
                  (dupes.length > 0 && !confirmedDuplicate)
                }
                onClick={save}
              >
                {dupes.length > 0 ? 'Create anyway' : 'Create deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
