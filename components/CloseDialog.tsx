'use client'
import { useState } from 'react'
import { create } from 'zustand'
import { useStore, Deal } from '@/lib/store'
import { toast } from '@/components/Toaster'
import { useEsc } from '@/components/useEsc'
type Out = 'Won' | 'Cancelled'
const useC = create<{ id: string | null; out?: Out }>(() => ({ id: null }))
export const askClose = (id: string, out?: Out) => useC.setState({ id, out })
export const stageTo = (id: string, stage: number, out?: Out) => { if (stage === 4) askClose(id, out); else useStore.getState().setStage(id, stage) }
function Dlg({ deal, pre }: { deal: Deal; pre?: Out }) {
  const closeDeal = useStore((s) => s.closeDeal)
  const [out, setOut] = useState<Out>(pre || deal.outcome || 'Won'); const [note, setNote] = useState(deal.closeNote || '')
  const won = out === 'Won'; const shut = () => useC.setState({ id: null, out: undefined }); useEsc(true, shut)
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 md:place-items-center md:p-4" onClick={shut}>
      <div role="dialog" aria-label="Close deal" className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-lg md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-semibold">Close {deal.company}</p><p className="mb-4 text-sm text-mute">How did this deal end? Add a note for your team.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setOut('Won')} className={`rounded-xl border-2 p-3 text-sm font-medium ${won ? 'border-green-600 bg-green-600 text-white' : 'border-green-600/40 text-green-600'}`}>✓ Deal done</button>
          <button onClick={() => setOut('Cancelled')} className={`rounded-xl border-2 p-3 text-sm font-medium ${!won ? 'border-red-500 bg-red-500 text-white' : 'border-red-500/40 text-red-500'}`}>✕ Cancelled</button></div>
        <label className="mt-4 grid gap-1 text-sm">Note (required)<textarea rows={3} className="inp" placeholder={won ? 'e.g. Signed for 12 months, onboarding next week' : 'e.g. Budget frozen / went with a competitor'} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="mt-4 flex gap-2"><button className="btn2 flex-1" onClick={shut}>Back</button>
          <button disabled={!note.trim()} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 ${won ? 'bg-green-600' : 'bg-red-500'}`} onClick={() => { closeDeal(deal.id, out, note.trim()); shut(); toast(won ? 'Deal marked as done' : 'Deal cancelled') }}>{won ? 'Confirm done' : 'Confirm cancelled'}</button></div>
      </div></div>)
}
export default function CloseDialog() {
  const id = useC((s) => s.id); const pre = useC((s) => s.out); const deal = useStore((s) => s.deals.find((d) => d.id === id))
  return id && deal ? <Dlg key={id + (pre || '')} deal={deal} pre={pre} /> : null
}
