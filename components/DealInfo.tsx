/** Deal details card: GST, contacts, files and notes. */
'use client'
import { useState } from 'react'
import { Trash2, Upload, Phone, Mail } from 'lucide-react'
import { useStore } from '@/lib/store'
import Avatar from '@/components/Avatar'
import { findDupes } from '@/lib/dupes'
const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export default function DealInfo({ dealId }: { dealId: string }) {
  const { deals, contacts, files, updateDeal, addContact, deleteContact, addFiles, deleteFile } =
    useStore()
  const d = deals.find((deal) => deal.id === dealId)!
  const cs = contacts.filter((contact) => contact.dealId === dealId)
  const fs = files.filter((file) => file.dealId === dealId)
  const [comments, setComments] = useState({ name: '', phone: '', email: '' })
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const gstOk = !d.gst || GST.test(d.gst.toUpperCase())
  const gstDup = findDupes(
    deals.filter((deal) => deal.id !== d.id),
    { gst: d.gst },
  )[0]
  const pick = (l: FileList | null) =>
    l &&
    l.length &&
    addFiles(
      dealId,
      Array.from(l).map((f) => ({ name: f.name, size: f.size })),
    )
  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
      <div className="box grid content-start gap-3">
        <p className="font-medium">Deal details</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            Risk level
            <select
              className="inp"
              value={d.risk}
              onChange={(event) => updateDeal(d.id, { risk: event.target.value as 'Low' })}
            >
              {['Low', 'Medium', 'High'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Target date
            <input
              type="date"
              className="inp"
              value={d.target}
              onChange={(event) => updateDeal(d.id, { target: event.target.value })}
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          GST number
          <input
            className={`inp ${gstOk ? '' : 'border-red-500'}`}
            value={d.gst}
            maxLength={15}
            onChange={(event) => updateDeal(d.id, { gst: event.target.value.toUpperCase() })}
          />
          {!gstOk && (
            <span className="text-xs text-red-500">
              GST must be 15 characters, like 27AAAAA0000A1Z5
            </span>
          )}
          {gstDup && (
            <span className="text-xs text-amber-600">
              Same GST number as {gstDup.deal.id} ({gstDup.deal.company}, owner {gstDup.deal.rep}).
              Possible duplicate.
            </span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          Notes
          <textarea
            rows={3}
            className="inp"
            value={d.notes}
            onChange={(event) => updateDeal(d.id, { notes: event.target.value })}
          />
        </label>
      </div>
      <div className="grid gap-4">
        <div className="box">
          <p className="mb-3 font-medium">Contact details</p>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="inp"
              placeholder="Name"
              value={comments.name}
              onChange={(event) => setComments({ ...comments, name: event.target.value })}
            />
            <input
              className="inp"
              placeholder="Phone"
              value={comments.phone}
              onChange={(event) => setComments({ ...comments, phone: event.target.value })}
            />
            <input
              className="inp"
              placeholder="Email"
              value={comments.email}
              onChange={(event) => setComments({ ...comments, email: event.target.value })}
            />
          </div>
          <button
            className="btn mt-2"
            disabled={!comments.name.trim()}
            onClick={() => {
              addContact({ ...comments, dealId })
              setComments({ name: '', phone: '', email: '' })
            }}
          >
            Add contact
          </button>
          <ul className="mt-3 grid scroll-y max-h-44 gap-2 overflow-y-auto pr-1">
            {cs.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-3">
                  <Avatar name={contact.name} size={32} />
                  <span>
                    <b>{contact.name}</b>
                    <span className="block text-xs text-mute">
                      {contact.phone} {contact.email}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {contact.phone && (
                    <a aria-label="Call" href={`tel:${contact.phone}`}>
                      <Phone size={16} className="text-brand" />
                    </a>
                  )}
                  {contact.email && (
                    <a aria-label="Email" href={`mailto:${contact.email}`}>
                      <Mail size={16} className="text-brand" />
                    </a>
                  )}
                  <button aria-label="Remove" onClick={() => deleteContact(contact.id)}>
                    <Trash2 size={16} className="text-mute" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="box">
          <p className="mb-3 font-medium">Files</p>
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setIsDraggingOver(true)
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDraggingOver(false)
              pick(event.dataTransfer.files)
            }}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-5 text-sm text-mute ${isDraggingOver ? 'border-brand bg-brand/10' : 'border-line'}`}
          >
            <Upload size={20} className="text-brand" />
            Drop files here or tap to choose
            <input type="file" multiple hidden onChange={(event) => pick(event.target.files)} />
          </label>
          <ul className="mt-3 grid scroll-y max-h-44 gap-2 overflow-y-auto pr-1">
            {fs.map((file) => (
              <li
                key={file.id}
                className="flex justify-between rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span>
                  {file.name}{' '}
                  <span className="text-xs text-mute">
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                </span>
                <button aria-label="Remove" onClick={() => deleteFile(file.id)}>
                  <Trash2 size={16} className="text-mute" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mute">
            Demo: file names are saved, the files themselves are not uploaded.
          </p>
        </div>
      </div>
    </div>
  )
}
