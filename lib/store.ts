import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export type Role = 'rep' | 'admin' | 'ceo'
export type Billing = 'One-time' | 'Monthly' | 'Annual'
export type Item = { id: string; product: string; qty: number; list: number; price: number; gst: number; billing?: Billing; term?: number }
export type QStatus = 'Draft' | 'Pending approval' | 'Approved' | 'Rejected' | 'Sent' | 'Accepted'
export type Quote = { id: string; dealId: string; version: number; status: QStatus; items: Item[]; reason?: string; need?: 'admin' | 'ceo'; log: string[]; expires: string; final?: boolean }
export type Deal = { id: string; company: string; client: string; rep: string; stage: number; risk: 'Low' | 'Medium' | 'High'; gst: string; target: string; notes: string; amount?: number; outcome?: 'Won' | 'Cancelled'; closeNote?: string; closedAt?: string }
export type Act = { id: string; dealId: string; text: string; at: string }
export type Rec = { id: string; dealId: string; type: 'Call' | 'Meeting' | 'Email' | 'Note'; text: string; at: string; by: string }
export type Social = { id: string; dealId: string; platform: string; handle: string }
export const PLATFORMS = ['LinkedIn', 'Instagram', 'Facebook', 'X (Twitter)', 'YouTube', 'WhatsApp', 'Website']
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2)
export type Notif = { id: string; to: Role; text: string; href: string; read: boolean; at: string }
export type Contact = { id: string; dealId: string; name: string; phone: string; email: string }
export type FileRec = { id: string; dealId: string; name: string; size: number }
export type User = { id: string; name: string; email: string; password: string; role: Role; phone: string; city: string; target: number }
export type Invoice = { id: string; dealId: string; quoteId: string; subtotal: number; gst: number; amount: number; date: string; due: string; status: 'Unpaid' | 'Paid'; by: string }
export type Payment = { id: string; dealId: string; quoteId: string; kind: 'Monthly' | 'Annual'; n: number; of: number; due: string; amount: number; status: 'Due' | 'Paid'; notified?: boolean }
export type Task = { id: string; dealId: string; title: string; due: string; done: boolean; rep: string }
export type Product = { id: string; name: string; list: number; min: number; billing?: Billing }
export type Settings = { auto: number; admin: number; remindDays?: number }
export const STAGES = ['Discover', 'Identify', 'Next', 'Proposal', 'Closed']
const mult = (i: Item) => (i.billing === 'Monthly' ? i.term ?? 12 : i.billing === 'Annual' ? (i.term ?? 12) / 12 : 1)
export const lineAmt = (i: Item) => i.price * i.qty * mult(i)
export const arrOf = (q: Quote) => q.items.reduce((s, i) => s + (i.billing === 'Monthly' ? i.price * i.qty * 12 : i.billing === 'Annual' ? i.price * i.qty : 0), 0)
export const isWon = (d: Deal) => d.stage === 4 && d.outcome !== 'Cancelled'
export const isLost = (d: Deal) => d.stage === 4 && d.outcome === 'Cancelled'
export const discountPct = (q: Quote) => { const l = q.items.reduce((s, i) => s + i.list * i.qty * mult(i), 0); const p = q.items.reduce((s, i) => s + lineAmt(i), 0); return l ? Math.max(0, ((l - p) / l) * 100) : 0 }
export const total = (q: Quote) => q.items.reduce((s, i) => s + lineAmt(i) * (1 + i.gst / 100), 0)
// Tiers: <=5% auto, 5-15% admin or ceo, >15% ceo only
export const needFor = (d: number, l: Settings = { auto: 5, admin: 15 }): 'auto' | 'admin' | 'ceo' => (d <= l.auto ? 'auto' : d <= l.admin ? 'admin' : 'ceo')
export const belowMin = (q: Quote, ps: Product[]) => q.items.some((i) => { const p = ps.find((x) => x.name === i.product); return !!p && i.price < p.min })
export const needOf = (q: Quote, l: Settings, ps: Product[]) => (belowMin(q, ps) ? 'ceo' : needFor(discountPct(q), l))
export const dealValue = (qs: Quote[], id: string) => { const a = qs.filter((q) => q.dealId === id && q.status !== 'Rejected'); const w = a.find((q) => q.final) || a.find((q) => q.status === 'Accepted'); return w ? total(w) : Math.max(0, ...a.map(total)) }
const addM = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1 + n, 1)); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(d, last)); return t.toISOString().slice(0, 10) }
// Payment schedule: Monthly lines bill every month for the term, Annual lines bill once per year
export const payPlan = (dealId: string, quoteId: string, items: Item[], start: string): Payment[] => {
  const out: Payment[] = []; const g = (i: Item) => i.price * i.qty * (1 + i.gst / 100)
  const mTerm = Math.max(0, ...items.filter((i) => i.billing === 'Monthly').map((i) => i.term ?? 12))
  for (let k = 0; k < mTerm; k++) out.push({ id: uid(), dealId, quoteId, kind: 'Monthly', n: k + 1, of: mTerm, due: addM(start, k), amount: items.filter((i) => i.billing === 'Monthly' && (i.term ?? 12) > k).reduce((s, i) => s + g(i), 0), status: 'Due' })
  const yrs = Math.max(0, ...items.filter((i) => i.billing === 'Annual').map((i) => Math.ceil((i.term ?? 12) / 12)))
  for (let k = 0; k < yrs; k++) out.push({ id: uid(), dealId, quoteId, kind: 'Annual', n: k + 1, of: yrs, due: addM(start, 12 * k), amount: items.filter((i) => i.billing === 'Annual' && Math.ceil((i.term ?? 12) / 12) > k).reduce((s, i) => s + g(i), 0), status: 'Due' })
  return out
}
const it = (p: string, q: number, l: number, pr: number, billing: Billing = 'One-time', term = 1): Item => ({ id: Math.random().toString(36).slice(2), product: p, qty: q, list: l, price: pr, gst: 18, billing, term })
type S = {
  payments: Payment[]; markPaid: (id: string, paid: boolean) => void; checkReminders: () => void
  loadSession: () => void; closeDeal: (id: string, outcome: 'Won' | 'Cancelled', note: string) => void
  users: User[]; meId: string | null; invoices: Invoice[]
  login: (email: string, pw: string) => User | null; addUser: (u: Omit<User, 'id' | 'role'>) => string | null; updateUser: (id: string, p: Partial<User>) => void
  markFinal: (quoteId: string) => void; createInvoice: (quoteId: string, by: string) => string; setInvoicePaid: (id: string, paid: boolean) => void
  tasks: Task[]; settings: Settings; products: Product[]
  addTask: (t: Omit<Task, 'id' | 'done'>) => void; toggleTask: (id: string) => void; delTask: (id: string) => void
  setSettings: (p: Partial<Settings>) => void
  addProduct: () => void; updateProduct: (id: string, p: Partial<Product>) => void; delProduct: (id: string) => void
  addDeal: (d: Omit<Deal, 'id' | 'stage'>) => string
  contacts: Contact[]; files: FileRec[]; updateDeal: (id: string, p: Partial<Deal>) => void
  addContact: (c: Omit<Contact, 'id'>) => void; delContact: (id: string) => void; addFiles: (dealId: string, f: { name: string; size: number }[]) => void; delFile: (id: string) => void
  notifs: Notif[]; markRead: (role: Role) => void
  activity: Act[]; records: Rec[]; socials: Social[]
  addRecord: (dealId: string, type: Rec['type'], text: string, by: string) => void
  addSocial: (dealId: string, platform: string, handle: string) => void; removeSocial: (id: string) => void
  role: Role | null; deals: Deal[]; quotes: Quote[]; setRole: (r: Role | null) => void
  addQuote: (dealId: string, from?: Quote) => string; saveQuote: (q: Quote) => void
  submit: (id: string, reason: string) => void; decide: (id: string, by: Role, ok: boolean, comment: string) => void
  setStatus: (id: string, s: QStatus) => void; setStage: (id: string, s: number) => void
}
export const useStore = create<S>()(persist((set, get) => {
  const log = (dealId: string, text: string) => set({ activity: [{ id: uid(), dealId, text, at: new Date().toISOString() }, ...get().activity] })
  const dealOf = (qid: string) => get().quotes.find((q) => q.id === qid)?.dealId || ''
  const notify = (to: Role[], text: string, href: string) => set({ notifs: [...to.map((r) => ({ id: uid(), to: r, text, href, read: false, at: new Date().toISOString() })), ...get().notifs] })
  return {
  addDeal: (d) => { const id = 'D-' + (get().deals.length + 1); set({ deals: [{ ...d, id, stage: 0 }, ...get().deals] }); log(id, 'Deal created'); return id },
  loadSession: () => { try { const v = JSON.parse(sessionStorage.getItem('crm-session') || 'null'); set({ role: v?.role ?? null, meId: v?.meId ?? null }) } catch { set({ role: null, meId: null }) } },
  closeDeal: (id, outcome, note) => { const d = get().deals.find((x) => x.id === id)!; const amt = outcome === 'Won' ? dealValue(get().quotes, id) : undefined
    set({ deals: get().deals.map((x) => (x.id === id ? { ...x, stage: 4, outcome, closeNote: note, closedAt: day(0), amount: amt } : x)) })
    log(id, outcome === 'Won' ? `Deal closed as won: ${note}` : `Deal cancelled: ${note}`); notify(['admin', 'ceo'], `${d.company} ${outcome === 'Won' ? 'closed (won)' : 'cancelled'}: ${note.slice(0, 60)}`, `deals/${id}`) },
  users: [
    { id: 'u1', name: 'Anita', email: 'anita@demo.com', password: 'demo123', role: 'rep', phone: '98765 43210', city: 'Mumbai', target: 500000 },
    { id: 'u2', name: 'Vikram', email: 'vikram@demo.com', password: 'demo123', role: 'rep', phone: '98220 11223', city: 'Pune', target: 600000 },
    { id: 'u3', name: 'Admin', email: 'admin@demo.com', password: 'demo123', role: 'admin', phone: '', city: 'Mumbai', target: 0 },
    { id: 'u4', name: 'CEO', email: 'ceo@demo.com', password: 'demo123', role: 'ceo', phone: '', city: 'Mumbai', target: 0 }],
  meId: null,
  invoices: [{ id: 'INV-001', dealId: 'D-4', quoteId: 'Q-004', subtotal: 12000, gst: 2160, amount: 14160, date: day(-5), due: day(10), status: 'Unpaid', by: 'Admin' }],
  login: (email, pw) => { const u = get().users.find((x) => x.email.toLowerCase() === email && x.password === pw); if (u) { try { sessionStorage.setItem('crm-session', JSON.stringify({ role: u.role, meId: u.id })) } catch {} set({ role: u.role, meId: u.id }) } return u || null },
  addUser: (u) => { if (get().users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) return 'This email is already in use.'; set({ users: [...get().users, { ...u, id: uid(), role: 'rep' }] }); return null },
  updateUser: (id, p) => set({ users: get().users.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
  markFinal: (id) => { const q = get().quotes.find((x) => x.id === id)!; const amt = total(q); const dl = get().deals.find((d) => d.id === q.dealId)
    set({ quotes: get().quotes.map((x) => (x.dealId !== q.dealId ? x : x.id === id ? { ...x, final: true, status: 'Accepted' as QStatus, log: [...x.log, 'Marked as final'] } : { ...x, final: false, status: x.status === 'Accepted' ? ('Sent' as QStatus) : x.status })), deals: get().deals.map((d) => (d.id === q.dealId ? { ...d, amount: amt, stage: 4, outcome: 'Won' as const, closeNote: `Quote ${id} marked final`, closedAt: day(0) } : d)) })
    set({ payments: [...get().payments.filter((p) => p.dealId !== q.dealId), ...payPlan(q.dealId, id, q.items, day(0))] })
    log(q.dealId, `Quote ${id} marked final · deal amount ₹${Math.round(amt).toLocaleString('en-IN')}`); notify(['admin', 'ceo'], `${id} for ${dl?.company} is final (₹${Math.round(amt).toLocaleString('en-IN')}). Invoice can be created.`, `deals/${q.dealId}`) },
  createInvoice: (qid, by) => { const q = get().quotes.find((x) => x.id === qid)!; const sub = q.items.reduce((s, i) => s + lineAmt(i), 0); const amount = total(q); const id = 'INV-' + String(get().invoices.length + 1).padStart(3, '0'); const dl = get().deals.find((d) => d.id === q.dealId)
    set({ invoices: [{ id, dealId: q.dealId, quoteId: qid, subtotal: sub, gst: amount - sub, amount, date: day(0), due: day(15), status: 'Unpaid', by }, ...get().invoices] })
    log(q.dealId, `Invoice ${id} created`); notify(['rep'], `Invoice ${id} created for ${dl?.company}`, `invoices/${id}`); return id },
  setInvoicePaid: (id, paid) => set({ invoices: get().invoices.map((i) => (i.id === id ? { ...i, status: paid ? 'Paid' : 'Unpaid' } : i)) }),
  tasks: [
    { id: 't1', dealId: 'D-2', title: 'Call Neha about bulk discount', due: day(0), done: false, rep: 'Anita' },
    { id: 't2', dealId: 'D-3', title: 'Send revised quote to Crest', due: day(-1), done: false, rep: 'Vikram' },
    { id: 't3', dealId: 'D-1', title: 'Follow up on sent quote Q-001', due: day(1), done: false, rep: 'Anita' },
    { id: 't4', dealId: 'D-5', title: 'Schedule product demo', due: day(3), done: false, rep: 'Anita' },
    { id: 't5', dealId: 'D-6', title: 'Confirm budget with Priya', due: day(0), done: false, rep: 'Vikram' },
    { id: 't6', dealId: 'D-4', title: 'Onboarding kickoff call', due: day(-3), done: true, rep: 'Anita' }],
  payments: [
    ...payPlan('D-10', 'Q-008', [it('CRM Subscription', 15, 1000, 1000, 'Monthly', 12)], addM(day(4), -2)).map((p) => (p.n <= 2 ? { ...p, status: 'Paid' as const } : p)),
    ...payPlan('D-11', 'Q-009', [it('Cloud Hosting', 1, 60000, 60000, 'Annual', 24)], addM(day(6), -12)).map((p) => (p.n === 1 ? { ...p, status: 'Paid' as const } : p))],
  markPaid: (id, paid) => { const p = get().payments.find((x) => x.id === id)!; set({ payments: get().payments.map((x) => (x.id === id ? { ...x, status: paid ? 'Paid' as const : 'Due' as const } : x)) }); log(p.dealId, `${p.kind} payment ${p.n}/${p.of} marked ${paid ? 'paid' : 'unpaid'}`) },
  checkReminders: () => { const lim = day(get().settings.remindDays ?? 7); const due = get().payments.filter((p) => p.status === 'Due' && !p.notified && p.due <= lim); if (!due.length) return
    due.forEach((p) => { const dl = get().deals.find((d) => d.id === p.dealId); notify(['admin', 'ceo', 'rep'], `${p.due < day(0) ? 'Overdue' : 'Reminder'}: ${p.kind.toLowerCase()} payment ${p.n}/${p.of} for ${dl?.company} (₹${Math.round(p.amount).toLocaleString('en-IN')}) due ${p.due}`, 'payments') })
    set({ payments: get().payments.map((p) => (due.some((d) => d.id === p.id) ? { ...p, notified: true } : p)) }) },
  settings: { auto: 5, admin: 15, remindDays: 7 },
  products: [
    { id: 'p1', name: 'CRM License', list: 1000, min: 800, billing: 'One-time' }, { id: 'p2', name: 'Onboarding', list: 5000, min: 4000, billing: 'One-time' },
    { id: 'p3', name: 'Support Plan', list: 2400, min: 2000, billing: 'One-time' }, { id: 'p4', name: 'Training', list: 1500, min: 1200, billing: 'One-time' }, { id: 'p5', name: 'API Add-on', list: 3000, min: 2500, billing: 'One-time' },
    { id: 'p6', name: 'CRM Subscription', list: 1000, min: 800, billing: 'Monthly' }, { id: 'p7', name: 'Cloud Hosting', list: 60000, min: 50000, billing: 'Annual' }],
  addTask: (t) => { set({ tasks: [{ ...t, id: uid(), done: false }, ...get().tasks] }); log(t.dealId, `Task added: ${t.title}`) },
  toggleTask: (id) => set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }),
  delTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
  setSettings: (p) => set({ settings: { ...get().settings, ...p } }),
  addProduct: () => set({ products: [...get().products, { id: uid(), name: 'New product', list: 1000, min: 800, billing: 'One-time' as Billing }] }),
  updateProduct: (id, p) => set({ products: get().products.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
  delProduct: (id) => set({ products: get().products.filter((x) => x.id !== id) }),
  contacts: [{ id: 'c1', dealId: 'D-10', name: 'Dr. Kavita Sen', phone: '98765 00011', email: 'kavita@jupiterhealth.example' }, { id: 'c2', dealId: 'D-11', name: 'Anand Kiran', phone: '98220 55667', email: 'anand@kirancloud.example' }], files: [],
  updateDeal: (id, p) => set({ deals: get().deals.map((d) => (d.id === id ? { ...d, ...p } : d)) }),
  addContact: (c) => { set({ contacts: [...get().contacts, { ...c, id: uid() }] }); log(c.dealId, `Contact ${c.name} added`) },
  delContact: (id) => set({ contacts: get().contacts.filter((x) => x.id !== id) }),
  addFiles: (dealId, f) => { set({ files: [...get().files, ...f.map((x) => ({ ...x, dealId, id: uid() }))] }); log(dealId, `${f.length} file(s) uploaded`) },
  delFile: (id) => set({ files: get().files.filter((x) => x.id !== id) }),
  notifs: [
    { id: 'n1', to: 'admin', text: 'Q-002 for Bluewave Foods needs approval (10.0% off)', href: 'approvals', read: false, at: new Date().toISOString() },
    { id: 'n2', to: 'ceo', text: 'Q-002 for Bluewave Foods needs approval (10.0% off)', href: 'approvals', read: false, at: new Date().toISOString() },
    { id: 'n3', to: 'ceo', text: 'Q-003 for Crest Logistics needs approval (20.0% off)', href: 'approvals', read: false, at: new Date().toISOString() }],
  markRead: (role) => set({ notifs: get().notifs.map((n) => (n.to === role ? { ...n, read: true } : n)) }),
  activity: [
    { id: 'a1', dealId: 'D-3', text: 'Quote Q-003 submitted', at: new Date().toISOString() },
    { id: 'a2', dealId: 'D-2', text: 'Quote Q-002 submitted', at: new Date(Date.now() - 36e5).toISOString() },
    { id: 'a3', dealId: 'D-4', text: 'Stage changed to Closed', at: new Date(Date.now() - 864e5).toISOString() },
    { id: 'a4', dealId: 'D-1', text: 'Quote Q-001 marked Sent', at: new Date(Date.now() - 2 * 864e5).toISOString() }], records: [], socials: [],
  addRecord: (dealId, type, text, by) => { set({ records: [{ id: uid(), dealId, type, text, at: new Date().toISOString(), by }, ...get().records] }); log(dealId, `${type} added: ${text.slice(0, 60)}`) },
  addSocial: (dealId, platform, handle) => { set({ socials: [...get().socials, { id: uid(), dealId, platform, handle }] }); log(dealId, `${platform} account added`) },
  removeSocial: (id) => set({ socials: get().socials.filter((x) => x.id !== id) }),
  role: null,
  deals: [
    { id: 'D-1', company: 'Acme Traders Pvt Ltd', client: 'Ravi Shah', rep: 'Anita', stage: 3, risk: 'Medium', gst: '27AAAAA0000A1Z5', target: '2026-11-15', notes: 'Wants annual plan.' },
    { id: 'D-2', company: 'Bluewave Foods', client: 'Neha Patil', rep: 'Anita', stage: 3, risk: 'Low', gst: '24BBBBB1111B1Z2', target: '2026-12-01', notes: 'Asked for a volume discount.' },
    { id: 'D-3', company: 'Crest Logistics', client: 'Imran Khan', rep: 'Vikram', stage: 3, risk: 'High', gst: '29CCCCC2222C1Z9', target: '2026-11-30', notes: 'Competitor is quoting lower.' },
    { id: 'D-4', company: 'Delta Pharma', client: 'Sunita Rao', rep: 'Anita', stage: 4, risk: 'Low', gst: '27DDDDD3333D1Z7', target: '2026-10-10', notes: 'Closed. Onboarding next week.', amount: 14160, outcome: 'Won', closeNote: 'Signed. Onboarding next week.', closedAt: '2026-10-10' },
    { id: 'D-5', company: 'Evergreen Retail', client: 'Karan Mehta', rep: 'Anita', stage: 1, risk: 'Medium', gst: '06EEEEE4444E1Z3', target: '2026-12-20', notes: '' },
    { id: 'D-6', company: 'Fusion Textiles', client: 'Priya Nair', rep: 'Vikram', stage: 2, risk: 'Low', gst: '33FFFFF5555F1Z8', target: '2026-12-05', notes: 'Demo done, waiting for budget.' },
    { id: 'D-7', company: 'Grid Energy', client: 'Arjun Das', rep: 'Vikram', stage: 0, risk: 'Medium', gst: '19GGGGG6666G1Z4', target: '2027-01-15', notes: '' },
    { id: 'D-8', company: 'Horizon Edu', client: 'Meera Iyer', rep: 'Anita', stage: 0, risk: 'Low', gst: '29HHHHH7777H1Z6', target: '2027-01-30', notes: '' },
    { id: 'D-9', company: 'Indigo Print Works', client: 'Rohit Jain', rep: 'Vikram', stage: 4, risk: 'High', gst: '27IIIII8888I1Z1', target: '2026-10-05', notes: '', outcome: 'Cancelled', closeNote: 'Budget frozen. Revisit next quarter.', closedAt: '2026-10-12' },
    { id: 'D-10', company: 'Jupiter Health', client: 'Dr. Kavita Sen', rep: 'Vikram', stage: 4, risk: 'Low', gst: '27JJJJJ9999J1Z0', target: '2026-10-15', notes: '', amount: 212400, outcome: 'Won', closeNote: '12-month subscription signed.', closedAt: '2026-10-15' },
    { id: 'D-11', company: 'Kiran Cloud Services', client: 'Anand Kiran', rep: 'Anita', stage: 4, risk: 'Low', gst: '29KKKKK1212K1Z5', target: '2026-10-01', notes: '', amount: 141600, outcome: 'Won', closeNote: '2-year hosting contract, billed yearly.', closedAt: '2026-10-01' },
  ],
  quotes: [
    { id: 'Q-001', dealId: 'D-1', version: 1, status: 'Sent', items: [it('CRM License', 10, 1000, 1000)], log: ['Created', 'Auto-approved (discount ≤ 5%)', 'Sent'], expires: '2026-11-10' },
    { id: 'Q-002', dealId: 'D-2', version: 1, status: 'Pending approval', need: 'admin', reason: 'Customer is buying 20 licenses and asked for a bulk rate.', items: [it('CRM License', 20, 1000, 900)], log: ['Created', 'Approval requested (10.0% off): Customer is buying 20 licenses and asked for a bulk rate.'], expires: '2026-11-12' },
    { id: 'Q-003', dealId: 'D-3', version: 1, status: 'Pending approval', need: 'ceo', reason: 'Competitor quoted 20% lower. Need to match to win.', items: [it('Onboarding', 3, 5000, 4000)], log: ['Created', 'Approval requested (20.0% off): Competitor quoted 20% lower. Need to match to win.'], expires: '2026-11-14' },
    { id: 'Q-004', dealId: 'D-4', version: 1, status: 'Accepted', final: true, items: [it('Support Plan', 5, 2400, 2400)], log: ['Created', 'Auto-approved (discount ≤ 5%)', 'Sent', 'Accepted'], expires: '2026-10-05' },
    { id: 'Q-005', dealId: 'D-6', version: 1, status: 'Approved', items: [it('CRM Subscription', 8, 1000, 950, 'Monthly', 12), it('Onboarding', 1, 5000, 5000)], log: ['Created', 'Auto-approved (discount ≤ 5%)'], expires: '2026-11-20' },
    { id: 'Q-006', dealId: 'D-5', version: 1, status: 'Draft', items: [it('Support Plan', 2, 2400, 2400)], log: ['Created'], expires: '2026-12-01' },
    { id: 'Q-007', dealId: 'D-9', version: 1, status: 'Sent', items: [it('Onboarding', 8, 5000, 5000)], log: ['Created', 'Sent'], expires: '2026-10-01' },
    { id: 'Q-008', dealId: 'D-10', version: 1, status: 'Accepted', final: true, items: [it('CRM Subscription', 15, 1000, 1000, 'Monthly', 12)], log: ['Created', 'Auto-approved (discount ≤ 5%)', 'Sent', 'Marked as final'], expires: '2026-10-10' },
    { id: 'Q-009', dealId: 'D-11', version: 1, status: 'Accepted', final: true, items: [it('Cloud Hosting', 1, 60000, 60000, 'Annual', 24)], log: ['Created', 'Auto-approved (discount ≤ 5%)', 'Sent', 'Marked as final'], expires: '2026-10-01' },
  ],
  setRole: (role) => { try { if (role) sessionStorage.setItem('crm-session', JSON.stringify({ role, meId: get().meId })); else sessionStorage.removeItem('crm-session') } catch {} set({ role, meId: role ? get().meId : null }) },
  addQuote: (dealId, from) => { const n = get().quotes.length + 1; const id = 'Q-' + String(n).padStart(3, '0')
    const q: Quote = { id, dealId, version: from ? from.version + 1 : 1, status: 'Draft', items: from ? from.items.map((i) => ({ ...i, id: Math.random().toString(36).slice(2) })) : [it('CRM License', 1, 1000, 1000)], log: [from ? `Duplicated from ${from.id}` : 'Created'], expires: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) }
    set({ quotes: [...get().quotes, q] }); log(dealId, `Quote ${id} created`); return id },
  saveQuote: (q) => set({ quotes: get().quotes.map((x) => (x.id === q.id ? q : x)) }),
  submit: (id, reason) => { log(dealOf(id), `Quote ${id} submitted`)
    const cq = get().quotes.find((q) => q.id === id)!; const nd = needOf(cq, get().settings, get().products); const dl = get().deals.find((d) => d.id === cq.dealId)
    if (nd !== 'auto') notify(nd === 'admin' ? ['admin', 'ceo'] : ['ceo'], `${id} for ${dl?.company} needs approval (${discountPct(cq).toFixed(1)}% off)`, `approvals`); set({ quotes: get().quotes.map((q) => { if (q.id !== id) return q; const n = needOf(q, get().settings, get().products)
    if (n === 'auto') return { ...q, status: 'Approved', need: undefined, log: [...q.log, 'Auto-approved (discount ≤ 5%)'] }
    return { ...q, status: 'Pending approval', need: n, reason, log: [...q.log, `Approval requested (${discountPct(q).toFixed(1)}% off): ${reason}`] } }) }) },
  decide: (id, by, ok, comment) => { log(dealOf(id), `Quote ${id} ${ok ? 'approved' : 'rejected'} by ${by}`); notify(['rep'], `${id} was ${ok ? 'approved' : 'rejected'} by ${by}${comment ? ': ' + comment : ''}`, `deals/${dealOf(id)}`); set({ quotes: get().quotes.map((q) => q.id === id ? { ...q, status: ok ? 'Approved' : 'Rejected', log: [...q.log, `${ok ? 'Approved' : 'Rejected'} by ${by}${comment ? ': ' + comment : ''}`] } : q) }) },
  setStatus: (id, s) => { log(dealOf(id), `Quote ${id} marked ${s}`); set({ quotes: get().quotes.map((q) => (q.id === id ? { ...q, status: s, log: [...q.log, s] } : q)) }) },
  setStage: (id, s) => { set({ deals: get().deals.map((d) => (d.id === id ? { ...d, stage: s, ...(s < 4 ? { outcome: undefined, closeNote: undefined, closedAt: undefined } : {}) } : d)) }); log(id, `Stage changed to ${STAGES[s]}`) },
} }, { name: 'crm-store', partialize: (s) => { const { role, meId, ...rest } = s; return rest } }))
