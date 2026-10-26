/** Sign-in page, with one-click demo accounts for each role. */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, TrendingUp, ShieldCheck, FileText } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'

const USERS: { email: string; role: Role; label: string }[] = [
  { email: 'anita@demo.com', role: 'rep', label: 'Sales rep' },
  { email: 'admin@demo.com', role: 'admin', label: 'Admin' },
  { email: 'ceo@demo.com', role: 'ceo', label: 'CEO' },
]
export default function Login() {
  const { login } = useStore()
  const r = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const go = () => {
    const user = login(email.trim().toLowerCase(), password)
    if (!user) return setErr('Email or password is incorrect. Use a demo account below.')
    r.push('/' + user.role)
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0f1a] px-[60px] py-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-48 -top-56 h-[720px] w-[720px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, rgba(232,119,34,.34) 0%, rgba(160,80,20,.18) 38%, transparent 68%)',
            filter: 'blur(30px)',
          }}
        />
        <p className="relative flex items-center gap-3.5 text-[22px] font-semibold">
          <span className="grid h-[46px] w-[46px] place-items-center rounded-lg bg-[#e87722] text-[22px] font-semibold text-white">
            P
          </span>
          Pipeline CRM
        </p>
        <div className="relative max-w-[560px]">
          <h1
            className="plain text-[44px] font-semibold leading-[1.15] tracking-tight"
            style={{ color: '#fff' }}
          >
            Close more deals with less chasing.
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-[#8b8f9c]">
            Track deals, send multiple quotations and get discounts approved in one place.
          </p>
          <ul className="mt-9 grid gap-[22px] text-base text-[#e6e7ea]">
            <li className="flex items-center gap-4">
              <TrendingUp size={20} strokeWidth={1.75} className="text-[#e87722]" />
              Live pipeline and revenue view
            </li>
            <li className="flex items-center gap-4">
              <FileText size={20} strokeWidth={1.75} className="text-[#e87722]" />
              Multiple quotations per deal
            </li>
            <li className="flex items-center gap-4">
              <ShieldCheck size={20} strokeWidth={1.75} className="text-[#e87722]" />
              Admin and CEO approval for price cuts
            </li>
          </ul>
        </div>
        <p className="relative text-sm text-[#6b6f7b]">Pipeline CRM · demo environment</p>
      </section>
      <section className="relative flex items-center justify-center p-6">
        <button
          className="btn2 absolute right-4 top-4"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="box w-full max-w-sm !p-8">
          <h2 className="text-2xl font-semibold">Sign in to Pipeline CRM</h2>
          <p className="mt-1 text-sm text-mute">Welcome back. Enter your details to continue.</p>
          <div className="mt-6 grid gap-3">
            <label className="grid gap-1 text-sm">
              Email
              <input
                className="inp"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErr('')
                }}
                placeholder="you@company.com"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Password
              <input
                className="inp"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setErr('')
                }}
                onKeyDown={(event) => event.key === 'Enter' && go()}
                placeholder="••••••"
              />
            </label>
            {err && (
              <p role="alert" className="text-sm text-red-500">
                {err}
              </p>
            )}
            <button className="btn mt-1" onClick={go}>
              Sign in
            </button>
          </div>
          <div className="mt-6 glass-soft rounded-lg p-4">
            <p className="text-sm font-medium">
              Demo accounts <span className="font-normal text-mute">(password: demo123)</span>
            </p>
            <p className="mt-1 text-xs text-mute">
              Rep accounts created by Admin or CEO can sign in here too.
            </p>
            <div className="mt-3 grid gap-2">
              {USERS.map((u) => (
                <button
                  key={u.email}
                  className="btn2 flex justify-between text-left"
                  onClick={() => {
                    setEmail(u.email)
                    setPassword('demo123')
                    setErr('')
                  }}
                >
                  <span>{u.label}</span>
                  <span className="text-mute">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
