/** Shared TypeScript types for the CRM. */
export type Role = 'rep' | 'admin' | 'ceo'

export type Billing = 'One-time' | 'Monthly' | 'Annual'

export type Item = {
  id: string
  product: string
  qty: number
  list: number
  price: number
  gst: number
  billing?: Billing
  term?: number
}

export type QStatus = 'Draft' | 'Pending approval' | 'Approved' | 'Rejected' | 'Sent' | 'Accepted'

export type Quote = {
  id: string
  dealId: string
  version: number
  status: QStatus
  items: Item[]
  reason?: string
  need?: 'admin' | 'ceo'
  log: string[]
  expires: string
  final?: boolean
  startDate?: string
  /** Terms and conditions printed on this quotation. Falls back to the default in Settings. */
  terms?: string
}

export type Deal = {
  id: string
  company: string
  client: string
  rep: string
  stage: number
  risk: 'Low' | 'Medium' | 'High'
  gst: string
  target: string
  notes: string
  amount?: number
  outcome?: 'Won' | 'Cancelled'
  lostReason?: string
  closeNote?: string
  closedAt?: string
}

export type Act = {
  id: string
  dealId: string
  text: string
  at: string
  by?: string
  byRole?: Role
}

export type Rec = {
  id: string
  dealId: string
  type: 'Call' | 'Meeting' | 'Email' | 'Note'
  text: string
  at: string
  by: string
  contact?: string
  outcome?: string
  duration?: number
  next?: string
  nextDue?: string
}

export type Social = { id: string; dealId: string; platform: string; handle: string }

export type Notif = {
  id: string
  to: Role
  text: string
  href: string
  read: boolean
  at: string
  user?: string
}

export type Contact = { id: string; dealId: string; name: string; phone: string; email: string }

export type FileRec = { id: string; dealId: string; name: string; size: number }

export type User = {
  id: string
  name: string
  email: string
  password: string
  role: Role
  phone: string
  city: string
  target: number
  photo?: string
}

export type Invoice = {
  id: string
  dealId: string
  quoteId: string
  subtotal: number
  gst: number
  amount: number
  date: string
  due: string
  status: 'Unpaid' | 'Paid'
  by: string
  /** Terms and conditions printed on this invoice (can differ from the quotation). */
  terms?: string
}

export type Payment = {
  id: string
  dealId: string
  quoteId: string
  kind: 'Monthly' | 'Annual'
  n: number
  of: number
  due: string
  amount: number
  status: 'Due' | 'Paid'
  notified?: boolean
}

export type Task = {
  id: string
  dealId: string
  title: string
  due: string
  done: boolean
  rep: string
  kind?: 'followup'
  notified?: boolean
  remindRole?: Role
  remindUser?: string
}

export type Product = { id: string; name: string; list: number; min: number; billing?: Billing }

/** Where the client should send the money. Shown on invoices and quotations. */
export type BankDetails = {
  accountName: string
  bankName: string
  accountNo: string
  ifsc: string
  upi: string
}

export type Settings = {
  auto: number
  admin: number
  remindDays?: number
  /** Terms and conditions pre-filled on new quotations and invoices. */
  defaultTerms?: string
  bank?: BankDetails
  /** Payment QR code image, stored as a data URL. */
  qr?: string
}

/** Everything the store keeps as data (this is what gets saved to localStorage). */
export type CrmData = {
  payments: Payment[]
  users: User[]
  meId: string | null
  invoices: Invoice[]
  tasks: Task[]
  settings: Settings
  products: Product[]
  contacts: Contact[]
  files: FileRec[]
  notifs: Notif[]
  activity: Act[]
  records: Rec[]
  socials: Social[]
  role: Role | null
  deals: Deal[]
  quotes: Quote[]
}

/** Every function the store exposes for changing that data. */
export type CrmActions = {
  markPaymentPaid: (id: string, paid: boolean) => void
  checkReminders: () => void
  loadSession: () => void
  closeDeal: (id: string, outcome: 'Won' | 'Cancelled', note: string, reason?: string) => void
  logActivity: (dealId: string, text: string) => void
  login: (email: string, password: string) => User | null
  addUser: (user: Omit<User, 'id' | 'role'>) => string | null
  updateUser: (id: string, changes: Partial<User>) => void
  markQuoteFinal: (quoteId: string) => void
  createInvoice: (quoteId: string, by: string) => string
  setInvoicePaid: (id: string, paid: boolean) => void
  updateInvoice: (id: string, changes: Partial<Pick<Invoice, 'terms'>>) => void
  addTask: (task: Omit<Task, 'id' | 'done'>) => void
  addFollowUp: (dealId: string, due: string, note?: string) => void
  snoozeTask: (id: string, days: number) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  setSettings: (changes: Partial<Settings>) => void
  addProduct: () => void
  updateProduct: (id: string, changes: Partial<Product>) => void
  deleteProduct: (id: string) => void
  addDeal: (deal: Omit<Deal, 'id' | 'stage'>) => string
  updateDeal: (id: string, changes: Partial<Deal>) => void
  addContact: (contact: Omit<Contact, 'id'>) => void
  deleteContact: (id: string) => void
  addFiles: (dealId: string, f: { name: string; size: number }[]) => void
  deleteFile: (id: string) => void
  markRead: (role: Role, user?: string) => void
  addRecord: (
    dealId: string,
    type: Rec['type'],
    text: string,
    by: string,
    extra?: Partial<Pick<Rec, 'contact' | 'outcome' | 'duration' | 'next' | 'nextDue' | 'at'>>,
  ) => void
  addSocial: (dealId: string, platform: string, handle: string) => void
  removeSocial: (id: string) => void
  setRole: (role: Role | null) => void
  addQuote: (dealId: string, from?: Quote) => string
  saveQuote: (quote: Quote) => void
  submitForApproval: (id: string, reason: string) => void
  decideApproval: (id: string, by: Role, ok: boolean, comment: string) => void
  setQuoteStatus: (id: string, status: QStatus) => void
  setDealStage: (id: string, s: number) => void
}

export type CrmState = CrmData & CrmActions
