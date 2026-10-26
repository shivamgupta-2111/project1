/** Kanban board. Drag a deal between stages; closing opens the Won/Cancelled dialog. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Shell from '@/components/Shell'
import NewDeal from '@/components/NewDeal'
import RepLink from '@/components/RepLink'
import { stageTo } from '@/components/CloseDialog'
import { useStore } from '@/lib/store'
import { Deal, Role } from '@/lib/types'
import { dealValue } from '@/lib/deals'

const COLS = [
  { name: 'Discover', stage: 0 },
  { name: 'Identify', stage: 1 },
  { name: 'Next', stage: 2 },
  { name: 'Proposal', stage: 3 },
  { name: 'Closed · Done', stage: 4, out: 'Won' as const },
  { name: 'Cancelled', stage: 4, out: 'Cancelled' as const },
]
const colOf = (deal: Deal) => (deal.stage < 4 ? deal.stage : deal.outcome === 'Cancelled' ? 5 : 4)
export default function Pipeline() {
  const role = useParams().role as Role
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const { deals, quotes } = useStore()
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null)
  const mine = role === 'rep' ? deals.filter((deal) => deal.rep === myName) : deals
  return (
    <Shell role={role}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <p className="text-sm text-mute">
            Drag cards between tiles, or use the menu on a card. Closed and Cancelled ask for a
            note.
          </p>
        </div>
        <NewDeal role={role} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLS.map((c, index) => {
          const col = mine.filter((deal) => colOf(deal) === index)
          const tone =
            index === 4 ? 'border-green-600/50' : index === 5 ? 'border-red-500/50' : 'border-line'
          return (
            <div
              key={c.name}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverColumn(index)
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={() => {
                if (draggedDealId) stageTo(draggedDealId, c.stage, c.out)
                setDraggedDealId(null)
                setDragOverColumn(null)
              }}
              className={`scroll-y min-h-[220px] max-h-[60vh] overflow-y-auto rounded-xl border p-3 ${dragOverColumn === index ? 'border-brand bg-brand/5' : `${tone} glass-soft`}`}
            >
              <p className="mb-3 flex justify-between text-sm font-medium">
                <span
                  className={index === 4 ? 'text-green-600' : index === 5 ? 'text-red-500' : ''}
                >
                  {c.name}
                </span>
                <span className="pill bg-brand/10 text-brand">{col.length}</span>
              </p>
              <div className="grid gap-3">
                {col.length === 0 && (
                  <p className="py-6 text-center text-xs text-mute">Drop a deal here</p>
                )}
                {col.map((deal) => {
                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggedDealId(deal.id)}
                      onDragEnd={() => {
                        setDraggedDealId(null)
                        setDragOverColumn(null)
                      }}
                      className={`box cursor-grab p-3 active:cursor-grabbing ${index >= 4 ? `border-l-4 ${index === 5 ? 'border-l-red-500' : 'border-l-green-600'}` : ''}`}
                    >
                      <Link
                        href={`/${role}/deals/${deal.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {deal.company}
                      </Link>
                      <p className="text-xs text-mute">
                        {deal.client} · {deal.risk} risk
                        {role !== 'rep' && (
                          <>
                            {' '}
                            · <RepLink name={deal.rep} />
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        ₹{Math.round(dealValue(quotes, deal.id)).toLocaleString('en-IN')}
                      </p>
                      {index >= 4 && deal.closeNote && (
                        <p className="mt-1 text-xs text-mute">{deal.closeNote}</p>
                      )}
                      <select
                        aria-label="Move to"
                        className="inp mt-2 py-1 text-xs"
                        value={colOf(deal)}
                        onChange={(event) => {
                          const n = Number(event.target.value)
                          stageTo(deal.id, COLS[n].stage, COLS[n].out)
                        }}
                      >
                        {COLS.map((column, n) => (
                          <option key={column.name} value={n}>
                            {column.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
