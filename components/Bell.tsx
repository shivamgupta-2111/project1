'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell as B } from 'lucide-react'
import { useStore, Role } from '@/lib/store'
import { useEsc } from '@/components/useEsc'
export default function Bell({ role }: { role: Role }) {
  const { notifs, markRead } = useStore(); const [open, setOpen] = useState(false); const [toast, setToast] = useState<string | null>(null)
  const mine = notifs.filter((n) => n.to === role); const unread = mine.filter((n) => !n.read).length
  const prev = useRef(unread); const box = useRef<HTMLDivElement>(null); useEsc(open, () => setOpen(false))
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [open])
  useEffect(() => { if (unread > prev.current) { setToast(mine[0].text); const t = setTimeout(() => setToast(null), 6000); prev.current = unread; return () => clearTimeout(t) } prev.current = unread }, [unread, mine])
  return (
    <div ref={box} className="relative">
      <button className="btn2 relative" aria-label="Notifications" onClick={() => { setOpen(!open); if (!open) markRead(role) }}><B size={16} />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-brand px-1.5 text-[10px] text-white">{unread}</span>}</button>
      {open && <div className="absolute right-0 z-30 mt-2 max-h-96 w-72 overflow-auto rounded-[1.75rem] glass-dialog p-2">
        {mine.length === 0 ? <p className="p-3 text-sm text-mute">No alerts yet.</p> : mine.map((n) => <Link key={n.id} href={`/${role}/${n.href}`} onClick={() => setOpen(false)} className="block rounded-2xl p-3 text-sm hover:bg-brand/10">{n.text}<span className="block text-xs text-mute">{new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></Link>)}</div>}
      {toast && <div role="alert" className="fixed inset-x-4 top-4 z-40 rounded-[1.75rem] glass-dialog p-4 text-sm md:left-auto md:w-80">{toast}</div>}
    </div>)
}
