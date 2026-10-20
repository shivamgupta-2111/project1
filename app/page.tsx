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
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex" style={{ background: 'linear-gradient(135deg,#ff9a3c 0%,#ee4f7a 50%,#6a5cff 100%)' }}>
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" /><div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
        <p className="relative flex items-center gap-2 text-xl font-semibold"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand">P</span>Pipeline CRM</p>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">Close more deals with less chasing.</h1>
          <p className="mt-4 text-white/75">Track deals, send multiple quotations and get discounts approved in one place.</p>
          <ul className="mt-8 grid gap-4 text-sm text-white">
            <li className="glass-soft flex items-center gap-3 rounded-full px-4 py-2.5"><TrendingUp size={18} />Live pipeline and revenue view</li>
            <li className="glass-soft flex items-center gap-3 rounded-full px-4 py-2.5"><FileText size={18} />Multiple quotations per deal</li>
            <li className="glass-soft flex items-center gap-3 rounded-full px-4 py-2.5"><ShieldCheck size={18} />Admin and CEO approval for price cuts</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/75">College project · frontend demo</p>
      </section>
      <section className="relative flex items-center justify-center p-6">
        <button className="btn2 absolute right-4 top-4" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
        <div className="box w-full max-w-sm !p-8">
          <h2 className="grad-text w-fit text-3xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-mute">Welcome back. Enter your details to continue.</p>
          <div className="mt-6 grid gap-3">
            <label className="grid gap-1 text-sm">Email<input className="inp" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} placeholder="you@company.com" /></label>
            <label className="grid gap-1 text-sm">Password<input className="inp" type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} onKeyDown={(e) => e.key === 'Enter' && go()} placeholder="••••••" /></label>
            {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
            <button className="btn mt-1" onClick={go}>Sign in</button>
          </div>
          <div className="mt-8 glass-soft rounded-[1.75rem] p-4">
            <p className="text-sm font-medium">Demo accounts <span className="font-normal text-mute">(password: demo123)</span></p>
            <p className="mt-1 text-xs text-mute">Rep accounts created by Admin or CEO can sign in here too.</p>
            <div className="mt-3 grid gap-2">{USERS.map((u) => <button key={u.email} className="btn2 flex justify-between text-left" onClick={() => { setEmail(u.email); setPw('demo123'); setErr('') }}><span>{u.label}</span><span className="text-mute">{u.email}</span></button>)}</div>
          </div>
        </div>
      </section>
    </main>)
}
