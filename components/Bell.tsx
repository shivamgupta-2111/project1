'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell as B } from 'lucide-react'
import { useStore, Role } from '@/lib/store'
export default function Bell({ role }: { role: Role }) {
  const { notifs, markRead } = useStore(); const [open, setOpen] = useState(false); const [toast, setToast] = useState<string | null>(null)
  const mine = notifs.filter((n) => n.to === role); const unread = mine.filter((n) => !n.read).length
  const prev = useRef(unread)
  useEffect(() => { if (unread > prev.current) { setToast(mine[0].text); const t = setTimeout(() => setToast(null), 6000); prev.current = unread; return () => clearTimeout(t) } prev.current = unread }, [unread, mine])
  return (
    <div className="relative">
      <button className="btn2 relative" aria-label="Notifications" onClick={() => { setOpen(!open); if (!open) markRead(role) }}><B size={16} />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-brand px-1.5 text-[10px] text-white">{unread}</span>}</button>
      {open && <div className="absolute right-0 z-30 mt-2 max-h-96 w-72 overflow-auto rounded-xl border border-line bg-card p-2 shadow-lg">
        {mine.length === 0 ? <p className="p-3 text-sm text-mute">No alerts yet.</p> : mine.map((n) => <Link key={n.id} href={`/${role}/${n.href}`} onClick={() => setOpen(false)} className="block rounded-lg p-2 text-sm hover:bg-line/50">{n.text}<span className="block text-xs text-mute">{new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></Link>)}</div>}
      {toast && <div role="alert" className="fixed inset-x-4 top-4 z-40 rounded-xl border border-brand bg-card p-3 text-sm shadow-lg md:left-auto md:w-80">{toast}</div>}
    </div>)
}
