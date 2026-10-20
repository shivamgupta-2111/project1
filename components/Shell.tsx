'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CheckSquare, Sun, Moon, LogOut, Kanban, Users, ListChecks, BarChart3, Settings as Cog, UserPlus, TrendingUp, Receipt } from 'lucide-react'
import { useStore, Role } from '@/lib/store'
import Bell from '@/components/Bell'
const NAME: Record<Role, string> = { rep: 'Anita Rao', admin: 'Admin', ceo: 'CEO' }
export default function Shell({ role, children, wide }: { role: Role; children: React.ReactNode; wide?: boolean }) {
  const { role: me, setRole, quotes, invoices, tasks, deals } = useStore(); const { resolvedTheme, setTheme } = useTheme(); const path = usePathname(); const r = useRouter()
  const [ok, setOk] = useState(false); const name = useStore((s) => s.users.find((u) => u.id === s.meId)?.name) || NAME[role]
  useEffect(() => { useStore.getState().loadSession(); setOk(true); const f = (e: StorageEvent) => { if (e.key === 'crm-store') useStore.persist.rehydrate() }; window.addEventListener('storage', f); return () => window.removeEventListener('storage', f) }, [])
  useEffect(() => { if (ok && me !== role) r.replace('/') }, [ok, me, role, r])
  if (!ok || me !== role) return <div className="min-h-screen animate-pulse p-8"><div className="mb-6 h-8 w-48 rounded-lg bg-line" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-line" />)}</div></div>
  const adm = role !== 'rep'; const today = new Date().toISOString().slice(0, 10)
  const mineDeal = (id: string) => !!deals.find((d) => d.id === id && (adm || d.rep === name))
  const badge: Record<string, number> = {
    Approvals: quotes.filter((q) => q.status === 'Pending approval' && (role === 'ceo' || q.need === 'admin')).length,
    Tasks: tasks.filter((t) => !t.done && t.due <= today && (adm || t.rep === name)).length,
    Invoices: invoices.filter((i) => i.status === 'Unpaid' && mineDeal(i.dealId)).length + (role === 'admin' ? quotes.filter((q) => q.final && !invoices.some((i) => i.quoteId === q.id)).length : 0) }
  const nav = [
    { href: `/${role}`, label: 'Dashboard', icon: LayoutDashboard }, { href: `/${role}/pipeline`, label: 'Pipeline', icon: Kanban },
    { href: `/${role}/clients`, label: 'Clients', icon: Users }, { href: `/${role}/tasks`, label: 'Tasks', icon: ListChecks },
    ...(adm ? [{ href: `/${role}/team`, label: 'Team', icon: UserPlus }, { href: `/${role}/reports`, label: 'Reports', icon: BarChart3 }] : [{ href: `/${role}/profile`, label: 'My progress', icon: TrendingUp }]),
    { href: `/${role}/invoices`, label: 'Invoices', icon: Receipt },
    ...(adm ? [{ href: `/${role}/approvals`, label: 'Approvals', icon: CheckSquare }, { href: `/${role}/settings`, label: 'Settings', icon: Cog }] : [])]
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 sticky top-0 h-screen scroll-y flex-col self-start overflow-y-auto border-r border-line bg-card p-4 md:flex">
        <p className="mb-8 flex items-center gap-2 text-lg font-semibold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white">P</span>Pipeline</p>
        {nav.map((n) => <Link key={n.href} href={n.href} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${path === n.href ? 'bg-brand/10 font-medium text-brand' : 'text-mute hover:bg-brand/5 hover:text-ink'}`}><n.icon size={17} />{n.label}{badge[n.label] > 0 && <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">{badge[n.label]}</span>}</Link>)}
        <div className="mt-auto flex items-center gap-3 rounded-xl border border-line p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-sm font-semibold text-brand">{name[0]}</span>
          <div className="text-sm"><p className="font-medium">{name}</p><p className="text-xs capitalize text-mute">{role} portal</p></div>
        </div>
        <button className="mt-3 text-xs text-mute hover:text-brand" onClick={() => { if (confirm('Reset all demo data?')) { localStorage.removeItem('crm-store'); location.href = '/' } }}>Reset demo data</button>
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/80 px-4 py-3 backdrop-blur md:px-8">
          <span className="font-semibold md:hidden"><span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">P</span>Pipeline</span><span className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Bell role={role} />
            <button className="btn2" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="btn2" aria-label="Sign out" onClick={() => { setRole(null); r.push('/') }}><LogOut size={16} /></button>
          </div>
        </header>
        <main className={`mx-auto ${wide ? 'max-w-none' : 'max-w-6xl'} p-4 md:p-8`}>{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-line bg-card py-2 md:hidden">
        {nav.map((n) => <Link key={n.href} href={n.href} className={`flex min-w-[76px] shrink-0 flex-col items-center gap-0.5 text-[10px] ${path === n.href ? 'text-brand' : 'text-mute'}`}><span className="relative"><n.icon size={18} />{badge[n.label] > 0 && <span className="absolute -right-3 -top-2 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">{badge[n.label]}</span>}</span>{n.label}</Link>)}
      </nav>
    </div>)
}
