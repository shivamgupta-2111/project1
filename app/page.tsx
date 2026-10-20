'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, TrendingUp, ShieldCheck, FileText } from 'lucide-react'
import { useStore, Role } from '@/lib/store'
const USERS: { email: string; role: Role; label: string }[] = [
  { email: 'anita@demo.com', role: 'rep', label: 'Sales rep' },
  { email: 'admin@demo.com', role: 'admin', label: 'Admin' },
  { email: 'ceo@demo.com', role: 'ceo', label: 'CEO' }]
export default function Login() {
  const { login } = useStore(); const r = useRouter(); const { resolvedTheme, setTheme } = useTheme()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const go = () => { const u = login(email.trim().toLowerCase(), pw); if (!u) return setErr('Email or password is incorrect. Use a demo account below.'); r.push('/' + u.role) }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0f1a] p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
        <p className="relative flex items-center gap-2 text-xl font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand">P</span>Pipeline CRM</p>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">Close more deals with less chasing.</h1>
          <p className="mt-4 text-white/45">Track deals, send multiple quotations and get discounts approved in one place.</p>
          <ul className="mt-8 grid gap-4 text-sm text-white/80">
            <li className="flex items-center gap-3"><TrendingUp className="text-brand" size={18} />Live pipeline and revenue view</li>
            <li className="flex items-center gap-3"><FileText className="text-brand" size={18} />Multiple quotations per deal</li>
            <li className="flex items-center gap-3"><ShieldCheck className="text-brand" size={18} />Admin and CEO approval for price cuts</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/45">College project · frontend demo</p>
      </section>
      <section className="relative flex items-center justify-center p-6">
        <button className="btn2 absolute right-4 top-4" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-mute">Welcome back. Enter your details to continue.</p>
          <div className="mt-6 grid gap-3">
            <label className="grid gap-1 text-sm">Email<input className="inp" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} placeholder="you@company.com" /></label>
            <label className="grid gap-1 text-sm">Password<input className="inp" type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} onKeyDown={(e) => e.key === 'Enter' && go()} placeholder="••••••" /></label>
            {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
            <button className="btn mt-1" onClick={go}>Sign in</button>
          </div>
          <div className="mt-8 rounded-2xl border border-line p-4">
            <p className="text-sm font-medium">Demo accounts <span className="font-normal text-mute">(password: demo123)</span></p>
            <p className="mt-1 text-xs text-mute">Rep accounts created by Admin or CEO can sign in here too.</p>
            <div className="mt-3 grid gap-2">{USERS.map((u) => <button key={u.email} className="btn2 flex justify-between text-left" onClick={() => { setEmail(u.email); setPw('demo123'); setErr('') }}><span>{u.label}</span><span className="text-mute">{u.email}</span></button>)}</div>
          </div>
        </div>
      </section>
    </main>)
}
