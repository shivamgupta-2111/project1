/** Browser-style tabs for pages and deals that are open. */
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Pencil, X } from 'lucide-react'
import { useTabs } from '@/components/tabs'
import { Role } from '@/lib/types'

const label = (p: string) => {
  const s = p.split('/')[2]
  return s ? s[0].toUpperCase() + s.slice(1) : 'Dashboard'
}
export default function TabBar({ role, path }: { role: Role; path: string }) {
  const { tabs, main, rename, close } = useTabs()
  const r = useRouter()
  const mine = tabs.filter((t) => t.href.startsWith(`/${role}/`))
  const [edit, setEdit] = useState<{ href: string; v: string } | null>(null)
  const home = main.startsWith(`/${role}`) ? main : `/${role}`
  useEffect(() => {
    const h = (event: KeyboardEvent) => {
      if (event.altKey && /^[1-9]$/.test(event.key)) {
        const t = mine[Number(event.key) - 1]
        if (t) {
          event.preventDefault()
          r.push(t.href)
        }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })
  if (mine.length === 0) return null
  const save = () => {
    if (edit) rename(edit.href, edit.v)
    setEdit(null)
  }
  return (
    <div
      className="scroll-y flex items-center gap-1.5 overflow-x-auto px-4 pb-2 md:px-8"
      role="tablist"
      aria-label="Open items"
    >
      <Link
        href={home}
        className={`flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs ${mine.some((t) => t.href === path) ? 'border-line text-mute hover:bg-ink/5' : 'border-brand/60 bg-brand/15 text-brand'}`}
      >
        <Home size={12} />
        {label(home)}
      </Link>
      {mine.map((t, index) => {
        const on = t.href === path
        const name = t.custom || t.title
        return (
          <div
            key={t.href}
            role="tab"
            aria-selected={on}
            className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs ${on ? 'border-brand/60 bg-brand/15 text-brand' : 'border-line text-mute hover:bg-ink/5'}`}
          >
            <span
              className="grid h-4 w-4 place-items-center rounded bg-brand/15 text-[10px] font-semibold text-brand"
              title={`Alt+${index + 1}`}
            >
              {index + 1}
            </span>
            {edit?.href === t.href ? (
              <input
                autoFocus
                onFocus={(event) => event.target.select()}
                className="w-28 rounded-md border border-brand bg-card px-1 text-xs text-ink outline-none"
                value={edit.v}
                onChange={(event) => setEdit({ href: t.href, v: event.target.value })}
                onBlur={save}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') save()
                  if (event.key === 'Escape') setEdit(null)
                }}
              />
            ) : (
              <button
                className="max-w-[10rem] truncate"
                title="Double-click to rename"
                onClick={() => r.push(t.href)}
                onDoubleClick={() => setEdit({ href: t.href, v: name })}
              >
                {name}
              </button>
            )}
            <button aria-label="Rename tab" onClick={() => setEdit({ href: t.href, v: name })}>
              <Pencil size={11} />
            </button>
            <button
              aria-label="Close tab"
              onClick={() => {
                const next = close(t.href)
                if (on) r.push(next || home)
              }}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
