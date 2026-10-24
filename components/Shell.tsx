'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CheckSquare, Sun, Moon, LogOut, Kanban, Users, ListChecks, BarChart3, Settings as Cog, UserPlus, TrendingUp, Receipt, CalendarClock, Layers, History } from 'lucide-react'
import { useStore, Role } from '@/lib/store'
import Bell from '@/components/Bell'
import Avatar from '@/components/Avatar'
import TabBar from '@/components/TabBar'
import { useTabs } from '@/components/tabs'
const NAME: Record<Role, string> = { rep: 'Anita Rao', admin: 'Admin', ceo: 'CEO' }
export default function Shell({ role, children, wide }: { role: Role; children: React.ReactNode; wide?: boolean }) {
  const { role: me, setRole, quotes, invoices, tasks, deals, payments, settings } = useStore(); const { resolvedTheme, setTheme } = useTheme(); const path = usePathname(); const r = useRouter()
  const [ok, setOk] = useState(false); const name = useStore((s) => s.users.find((u) => u.id === s.meId)?.name) || NAME[role]; const photo = useStore((s) => s.users.find((u) => u.id === s.meId)?.photo)
  useEffect(() => { useStore.getState().loadSession(); useStore.getState().checkReminders(); setOk(true); const f = (e: StorageEvent) => { if (e.key === 'crm-store') useStore.persist.rehydrate() }; window.addEventListener('storage', f); return () => window.removeEventListener('storage', f) }, [])
  useEffect(() => { if (ok && me !== role) r.replace('/') }, [ok, me, role, r])
  const users = useStore((s) => s.users); const isTab = /\/(deals|team)\/[^/]+$/.test(path)
  useEffect(() => { if (!ok || me !== role) return; const t = useTabs.getState(); if (!isTab) { t.setMain(path); return }
    const id = path.split('/').pop()!; const title = path.includes('/deals/') ? deals.find((d) => d.id === id)?.company : users.find((u) => u.id === id)?.name; t.open(path, title || id) }, [ok, me, role, path, isTab, deals, users])
  if (!ok || me !== role) return <div className="min-h-screen animate-pulse p-8"><div className="mb-6 h-8 w-48 rounded-2xl bg-line" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-line" />)}</div></div>
  const adm = role !== 'rep'; const today = new Date().toISOString().slice(0, 10)
  const mineDeal = (id: string) => !!deals.find((d) => d.id === id && (adm || d.rep === name))
  const badge: Record<string, number> = {
    Approvals: quotes.filter((q) => q.status === 'Pending approval' && (role === 'ceo' || q.need === 'admin')).length,
    Payments: payments.filter((x) => x.status === 'Due' && x.due <= new Date(Date.now() + (settings.remindDays ?? 7) * 864e5).toISOString().slice(0, 10) && mineDeal(x.dealId)).length,
    Tasks: tasks.filter((t) => !t.done && t.due <= today && (adm || t.rep === name)).length,
    Invoices: invoices.filter((i) => i.status === 'Unpaid' && mineDeal(i.dealId)).length + (role === 'admin' ? quotes.filter((q) => q.final && !invoices.some((i) => i.quoteId === q.id)).length : 0) }
  const nav = [
    { href: `/${role}`, label: 'Dashboard', icon: LayoutDashboard }, { href: `/${role}/pipeline`, label: 'Pipeline', icon: Kanban }, { href: `/${role}/stages`, label: 'Stages', icon: Layers },
    { href: `/${role}/clients`, label: 'Clients', icon: Users }, { href: `/${role}/tasks`, label: 'Tasks', icon: ListChecks },
    ...(adm ? [{ href: `/${role}/team`, label: 'Team', icon: UserPlus }, { href: `/${role}/reports`, label: 'Reports', icon: BarChart3 }] : [{ href: `/${role}/profile`, label: 'My progress', icon: TrendingUp }]),
    { href: `/${role}/invoices`, label: 'Invoices', icon: Receipt }, { href: `/${role}/payments`, label: 'Payments', icon: CalendarClock },
    ...(adm ? [{ href: `/${role}/approvals`, label: 'Approvals', icon: CheckSquare }, { href: `/${role}/audit`, label: 'Audit log', icon: History }, { href: `/${role}/settings`, label: 'Settings', icon: Cog }] : [])]
  return (
    <div className="min-h-screen md:flex md:gap-0">
      <aside className="glass hidden w-64 shrink-0 sticky top-3 m-3 mr-0 h-[calc(100vh-1.5rem)] scroll-y flex-col self-start overflow-y-auto rounded-[2.25rem] p-4 md:flex">
        <p className="mb-8 flex items-center gap-2 text-lg font-semibold"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-md">P</span><span className="grad-text">Pipeline</span></p>
        {nav.map((n) => <Link key={n.href} href={n.href} className={`nav-pill mb-1.5 flex items-center gap-3 rounded-full px-4 py-2.5 text-sm ${path === n.href ? 'nav-on font-medium' : 'nav-off text-mute hover:text-ink'}`}><n.icon size={17} />{n.label}{badge[n.label] > 0 && <span className="ml-auto rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-brand shadow-sm">{badge[n.label]}</span>}</Link>)}
        <Link href={`/${role}/profile`} title="Edit profile and photo" className="glass-soft mt-auto flex items-center gap-3 rounded-full p-2.5 pr-4 transition hover:shadow-md">
          <Avatar name={name} photo={photo} size={36} />
          <div className="text-sm"><p className="font-medium">{name}</p><p className="text-xs capitalize text-mute">{role} portal</p></div>
        </Link>
        <button className="mt-3 text-xs text-mute hover:text-brand" onClick={() => { if (confirm('Reset all demo data?')) { localStorage.removeItem('crm-store'); location.href = '/' } }}>Reset demo data</button>
      </aside>
      <div className="min-w-0 flex-1 pb-28 md:pb-3">
        <div className="glass sticky top-3 z-20 mx-3 mt-3 rounded-[2rem] md:mx-5"><header className="flex items-center justify-between px-4 py-2.5 md:px-6">
          <span className="font-semibold md:hidden"><span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-2xl bg-brand text-white">P</span>Pipeline</span><span className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Link href={`/${role}/profile`} className="md:hidden" aria-label="Profile"><Avatar name={name} photo={photo} size={36} /></Link>
            <Bell role={role} />
            <button className="btn2" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="btn2" aria-label="Sign out" onClick={() => { useTabs.getState().clear(); setRole(null); r.push('/') }}><LogOut size={16} /></button>
          </div>
        </header><TabBar role={role} path={path} /></div>
        <main className={`mx-auto ${wide ? 'max-w-none' : 'max-w-6xl'} p-4 md:p-8`}>{children}</main>
      </div>
      <nav className="glass scroll-y fixed inset-x-3 bottom-3 z-20 flex overflow-x-auto rounded-full px-2 py-2.5 md:hidden">
        {nav.map((n) => <Link key={n.href} href={n.href} className={`flex min-w-[76px] shrink-0 flex-col items-center gap-0.5 text-[10px] ${path === n.href ? 'font-semibold text-brand' : 'text-mute'}`}><span className="relative"><n.icon size={18} />{badge[n.label] > 0 && <span className="absolute -right-3 -top-2 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">{badge[n.label]}</span>}</span>{n.label}</Link>)}
      </nav>
    </div>)
}
