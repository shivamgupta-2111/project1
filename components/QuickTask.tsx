/** Small form for adding a task. */
'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { toast } from '@/components/Toaster'
import { Role } from '@/lib/types'

export default function QuickTask({ role = 'admin', dealId }: { role?: Role; dealId?: string }) {
  const { deals, addTask } = useStore()
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const mine = role === 'rep' ? deals.filter((deal) => deal.rep === myName) : deals
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [selectedDealId, setSelectedDealId] = useState('')
  const [due, setDue] = useState(today)
  const target = deals.find((deal) => deal.id === (dealId || selectedDealId || mine[0]?.id))
  const add = () => {
    if (!target || !title.trim()) return
    addTask({ title: title.trim(), dealId: target.id, due, rep: target.rep })
    setTitle('')
    toast('Task added')
  }
  return (
    <div
      className={`grid gap-2 ${dealId ? 'md:grid-cols-[1fr_150px_auto]' : 'md:grid-cols-[1fr_160px_140px_auto]'}`}
    >
      <input
        className="inp"
        placeholder="Add a task…"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && add()}
      />
      {!dealId && (
        <select
          className="inp"
          aria-label="Deal"
          value={selectedDealId || mine[0]?.id || ''}
          onChange={(event) => setSelectedDealId(event.target.value)}
        >
          {mine.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.company}
            </option>
          ))}
        </select>
      )}
      <input
        type="date"
        className="inp"
        value={due}
        onChange={(event) => setDue(event.target.value)}
        aria-label="Due date"
      />
      <button className="btn" disabled={!title.trim() || !target} onClick={add}>
        Add
      </button>
    </div>
  )
}
