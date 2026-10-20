'use client'
import { useParams } from 'next/navigation'
import { Trash2, Plus } from 'lucide-react'
import Shell from '@/components/Shell'
import { useStore, Role, Billing } from '@/lib/store'
const TEAM = [['Anita Rao', 'anita@demo.com', 'Sales rep'], ['Vikram Singh', 'vikram@demo.com', 'Sales rep'], ['Admin', 'admin@demo.com', 'Admin'], ['CEO', 'ceo@demo.com', 'CEO']]
export default function SettingsPage() {
  const role = useParams().role as Role; const { settings, setSettings, products, addProduct, updateProduct, delProduct } = useStore()
  if (role === 'rep') return <Shell role={role}><p className="box text-sm text-mute">Settings are available to Admin and CEO.</p></Shell>
  const num = (v: string) => Math.max(0, Math.min(100, Number(v) || 0))
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">Settings</h1><p className="mb-6 text-sm text-mute">Changes apply instantly to new approval requests.</p>
      <div className="box">
        <p className="font-medium">Approval rules</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">Auto-approve up to (%)<input type="number" className="inp" value={settings.auto} onChange={(e) => { const v = num(e.target.value); setSettings({ auto: v, admin: Math.max(v, settings.admin) }) }} /></label>
          <label className="grid gap-1 text-sm">Admin can approve up to (%)<input type="number" className="inp" value={settings.admin} onChange={(e) => setSettings({ admin: Math.max(settings.auto, num(e.target.value)) })} /></label></div>
        <ul className="mt-4 grid gap-1 text-sm text-mute"><li>0–{settings.auto}%: auto-approved</li><li>{settings.auto}–{settings.admin}%: Admin or CEO</li><li>Above {settings.admin}% or below a product’s minimum price: CEO only</li></ul>
      </div>
      <div className="box mt-4"><p className="font-medium">Payment reminders</p>
        <label className="mt-3 grid max-w-xs gap-1 text-sm">Remind before due date (days)<input type="number" className="inp" value={settings.remindDays ?? 7} onChange={(e) => setSettings({ remindDays: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })} /></label>
        <p className="mt-2 text-xs text-mute">Monthly products remind every month. Annual (ARR) products remind once a year before renewal.</p></div>
      <div className="box mt-4">
        <div className="mb-3 flex items-center justify-between"><p className="font-medium">Products and price list</p><button className="btn2 flex items-center gap-1" onClick={addProduct}><Plus size={16} />Add</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs text-mute"><tr><th className="pb-2 font-medium">Product</th><th className="font-medium">Billing</th><th className="font-medium">List price (₹)</th><th className="font-medium">Minimum price (₹)</th><th /></tr></thead>
          <tbody>{products.map((p) => <tr key={p.id} className="border-t border-line">
            <td className="py-2 pr-2"><input className="inp" value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} /></td>
            <td className="pr-2"><select className="inp" value={p.billing ?? 'One-time'} onChange={(e) => updateProduct(p.id, { billing: e.target.value as Billing })}><option value="One-time">One-time</option><option value="Monthly">Monthly (per month)</option><option value="Annual">Annual (ARR)</option></select></td>
            <td className="pr-2"><input type="number" className="inp" value={p.list} onChange={(e) => updateProduct(p.id, { list: Number(e.target.value) || 0 })} /></td>
            <td className="pr-2"><input type="number" className="inp" value={p.min} onChange={(e) => updateProduct(p.id, { min: Number(e.target.value) || 0 })} /></td>
            <td><button aria-label="Delete" onClick={() => delProduct(p.id)}><Trash2 size={16} className="text-mute" /></button></td></tr>)}</tbody></table></div>
      </div>
      <div className="box mt-4"><p className="mb-3 font-medium">Team</p>
        <ul className="grid gap-2">{TEAM.map(([n, e, r]) => <li key={e} className="flex items-center justify-between rounded-full border border-line px-3 py-2 text-sm"><span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{n[0]}</span><span>{n}<span className="block text-xs text-mute">{e}</span></span></span><span className="pill bg-brand/10 text-brand">{r}</span></li>)}</ul></div>
    </Shell>)
}
