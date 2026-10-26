/** Notification bell in the top bar. */
'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell as B } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useEsc } from '@/components/useEsc'
import { Role } from '@/lib/types'

export default function Bell({ role }: { role: Role }) {
  const { notifs, markRead } = useStore()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const myName = useStore((state) => state.users.find((user) => user.id === state.meId)?.name)
  const mine = notifs.filter(
    (notification) =>
      notification.to === role && (!notification.user || notification.user === myName),
  )
  const unread = mine.filter((notification) => !notification.read).length
  const prev = useRef(unread)
  const box = useRef<HTMLDivElement>(null)
  useEsc(open, () => setOpen(false))
  useEffect(() => {
    if (!open) return
    const h = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  useEffect(() => {
    if (unread > prev.current) {
      setToast(mine[0].text)
      const t = setTimeout(() => setToast(null), 6000)
      prev.current = unread
      return () => clearTimeout(t)
    }
    prev.current = unread
  }, [unread, mine])
  return (
    <div ref={box} className="relative">
      <button
        className="btn2 relative"
        aria-label="Notifications"
        onClick={() => {
          setOpen(!open)
          if (!open) markRead(role, myName)
        }}
      >
        <B size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-brand px-1.5 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-96 w-72 overflow-auto rounded-xl glass-dialog p-2">
          {mine.length === 0 ? (
            <p className="p-3 text-sm text-mute">No alerts yet.</p>
          ) : (
            mine.map((notification) => (
              <Link
                key={notification.id}
                href={`/${role}/${notification.href}`}
                onClick={() => setOpen(false)}
                className="block rounded-2xl p-3 text-sm hover:bg-brand/10"
              >
                {notification.text}
                <span className="block text-xs text-mute">
                  {new Date(notification.at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
      {toast && (
        <div
          role="alert"
          className="fixed inset-x-4 top-4 z-40 rounded-xl glass-dialog p-4 text-sm md:left-auto md:w-80"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
