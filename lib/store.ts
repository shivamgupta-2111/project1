/** The app's data store: every action that changes deals, quotes, tasks, invoices and so on. Saved to localStorage. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Billing, CrmState, QStatus, Quote, Role } from '@/lib/types'
import { todayPlus, uid } from '@/lib/utils'
import { seedData } from '@/lib/seed'
import { dealValue } from '@/lib/deals'
import { approverForQuote, discountPercent, lineTotal, quoteTotal, makeItem } from '@/lib/pricing'
import { buildPaymentSchedule } from '@/lib/payments'
import { STAGES } from '@/lib/constants'

export const useStore = create<CrmState>()(
  persist(
    (set, get) => {
      /** Adds a line to the activity log, stamped with who did it and when. */
      const log = (dealId: string, text: string) => {
        const currentUser = get().users.find((user) => user.id === get().meId)
        set({
          activity: [
            {
              id: uid(),
              dealId,
              text,
              at: new Date().toISOString(),
              by: currentUser?.name ?? 'System',
              byRole: currentUser?.role,
            },
            ...get().activity,
          ],
        })
      }
      /** Looks up which deal a quote belongs to. */
      const dealIdOfQuote = (qid: string) =>
        get().quotes.find((quote) => quote.id === qid)?.dealId || ''
      /** Sends a bell notification to some roles. Pass `user` to make it visible to one person only. */
      const notify = (to: Role[], text: string, href: string, user?: string) =>
        set({
          notifs: [
            ...to.map((role) => ({
              id: uid(),
              to: role,
              text,
              href,
              read: false,
              at: new Date().toISOString(),
              user,
            })),
            ...get().notifs,
          ],
        })
      return {
        ...seedData,
        /** Create a deal in the Discover stage and return its id. */
        addDeal: (deal) => {
          const id = 'D-' + (get().deals.length + 1)
          set({ deals: [{ ...deal, id, stage: 0 }, ...get().deals] })
          log(id, 'Deal created')
          return id
        },
        /** Restore the signed-in user after a page refresh (the session lives in sessionStorage). */
        loadSession: () => {
          try {
            const v = JSON.parse(sessionStorage.getItem('crm-session') || 'null')
            set({ role: v?.role ?? null, meId: v?.meId ?? null })
          } catch {
            set({ role: null, meId: null })
          }
        },
        /** Add a free-text line to the activity log. Shown in deal timelines and the audit log. */
        logActivity: (dealId, text) => log(dealId, text),
        /** Close a deal as Won or Cancelled. A cancelled deal keeps its lost reason so Reports can break losses down. */
        closeDeal: (id, outcome, note, reason) => {
          const d = get().deals.find((deal) => deal.id === id)!
          const amt = outcome === 'Won' ? dealValue(get().quotes, id) : undefined
          set({
            deals: get().deals.map((deal) =>
              deal.id === id
                ? {
                    ...deal,
                    stage: 4,
                    outcome,
                    closeNote: note,
                    closedAt: todayPlus(0),
                    amount: amt,
                    lostReason: outcome === 'Cancelled' ? reason : undefined,
                  }
                : deal,
            ),
          })
          log(
            id,
            outcome === 'Won'
              ? `Deal closed as won: ${note}`
              : `Deal cancelled (${reason || 'no reason'}): ${note}`,
          )
          notify(
            ['admin', 'ceo'],
            `${d.company} ${outcome === 'Won' ? 'closed (won)' : `cancelled (${reason || 'no reason'})`}: ${note.slice(0, 60)}`,
            `deals/${id}`,
          )
        },
        /** Check email and password. On success, remember the user for this browser session and return them. */
        login: (email, password) => {
          const currentUser = get().users.find(
            (user) => user.email.toLowerCase() === email && user.password === password,
          )
          if (currentUser) {
            try {
              sessionStorage.setItem(
                'crm-session',
                JSON.stringify({ role: currentUser.role, meId: currentUser.id }),
              )
            } catch {}
            set({ role: currentUser.role, meId: currentUser.id })
          }
          return currentUser || null
        },
        /** Create a rep account. Returns an error message, or null when it worked. */
        addUser: (currentUser) => {
          if (
            get().users.some((user) => user.email.toLowerCase() === currentUser.email.toLowerCase())
          )
            return 'This email is already in use.'
          set({ users: [...get().users, { ...currentUser, id: uid(), role: 'rep' }] })
          log('', `Rep account created: ${currentUser.name} (${currentUser.email})`)
          return null
        },
        /** Edit a user's profile (phone, city, target, photo). */
        updateUser: (id, changes) =>
          set({
            users: get().users.map((user) => (user.id === id ? { ...user, ...changes } : user)),
          }),
        /** Make this the final quote: sets the deal amount, closes the deal as Won, builds the payment schedule and tells Admin and CEO. */
        markQuoteFinal: (id) => {
          const q = get().quotes.find((quote) => quote.id === id)!
          const amt = quoteTotal(q)
          const dl = get().deals.find((deal) => deal.id === q.dealId)
          set({
            quotes: get().quotes.map((quote) =>
              quote.dealId !== q.dealId
                ? quote
                : quote.id === id
                  ? {
                      ...quote,
                      final: true,
                      status: 'Accepted' as QStatus,
                      log: [...quote.log, 'Marked as final'],
                    }
                  : {
                      ...quote,
                      final: false,
                      status: quote.status === 'Accepted' ? ('Sent' as QStatus) : quote.status,
                    },
            ),
            deals: get().deals.map((deal) =>
              deal.id === q.dealId
                ? {
                    ...deal,
                    amount: amt,
                    stage: 4,
                    outcome: 'Won' as const,
                    lostReason: undefined,
                    closeNote: `Quote ${id} marked final`,
                    closedAt: todayPlus(0),
                  }
                : deal,
            ),
          })
          set({
            payments: [
              ...get().payments.filter((payment) => payment.dealId !== q.dealId),
              ...buildPaymentSchedule(q.dealId, id, q.items, q.startDate || todayPlus(0)),
            ],
          })
          log(
            q.dealId,
            `Quote ${id} marked final · deal amount ₹${Math.round(amt).toLocaleString('en-IN')}`,
          )
          notify(
            ['admin', 'ceo'],
            `${id} for ${dl?.company} is final (₹${Math.round(amt).toLocaleString('en-IN')}). Invoice can be created.`,
            `deals/${q.dealId}`,
          )
        },
        /** Create an invoice for a final quote (due in 15 days) and return its id. */
        createInvoice: (qid, by) => {
          const q = get().quotes.find((quote) => quote.id === qid)!
          const sub = q.items.reduce((sum, item) => sum + lineTotal(item), 0)
          const amount = quoteTotal(q)
          const id = 'INV-' + String(get().invoices.length + 1).padStart(3, '0')
          const dl = get().deals.find((deal) => deal.id === q.dealId)
          set({
            invoices: [
              {
                id,
                dealId: q.dealId,
                quoteId: qid,
                subtotal: sub,
                gst: amount - sub,
                amount,
                date: todayPlus(0),
                due: todayPlus(15),
                status: 'Unpaid',
                by,
              },
              ...get().invoices,
            ],
          })
          log(q.dealId, `Invoice ${id} created`)
          notify(['rep'], `Invoice ${id} created for ${dl?.company}`, `invoices/${id}`)
          return id
        },
        /** Mark an invoice as paid or unpaid. */
        setInvoicePaid: (id, paid) => {
          const inv = get().invoices.find((invoice) => invoice.id === id)
          set({
            invoices: get().invoices.map((invoice) =>
              invoice.id === id ? { ...invoice, status: paid ? 'Paid' : 'Unpaid' } : invoice,
            ),
          })
          if (inv) log(inv.dealId, `Invoice ${id} marked ${paid ? 'paid' : 'unpaid'}`)
        },
        /** Mark one scheduled payment as paid, or put it back to due. */
        markPaymentPaid: (id, paid) => {
          const p = get().payments.find((payment) => payment.id === id)!
          set({
            payments: get().payments.map((payment) =>
              payment.id === id
                ? { ...payment, status: paid ? ('Paid' as const) : ('Due' as const) }
                : payment,
            ),
          })
          log(p.dealId, `${p.kind} payment ${p.n}/${p.of} marked ${paid ? 'paid' : 'unpaid'}`)
        },
        /** Send notifications for payments due soon or overdue, and for follow-ups that have come due. Runs on load and every 5 minutes. */
        checkReminders: () => {
          const lim = todayPlus(get().settings.remindDays ?? 7)
          const due = get().payments.filter(
            (payment) => payment.status === 'Due' && !payment.notified && payment.due <= lim,
          )
          if (due.length) {
            due.forEach((payment) => {
              const dl = get().deals.find((deal) => deal.id === payment.dealId)
              notify(
                ['admin', 'ceo', 'rep'],
                `${payment.due < todayPlus(0) ? 'Overdue' : 'Reminder'}: ${payment.kind.toLowerCase()} payment ${payment.n}/${payment.of} for ${dl?.company} (₹${Math.round(payment.amount).toLocaleString('en-IN')}) due ${payment.due}`,
                'payments',
              )
            })
            set({
              payments: get().payments.map((p) =>
                due.some((payment) => payment.id === p.id) ? { ...p, notified: true } : p,
              ),
            })
          }
          // follow-up reminders go only to the person who set them
          const tasks = get().tasks.filter(
            (task) =>
              task.kind === 'followup' && !task.done && !task.notified && task.due <= todayPlus(0),
          )
          if (tasks.length) {
            set({
              tasks: get().tasks.map((t) =>
                tasks.some((task) => task.id === t.id) ? { ...t, notified: true } : t,
              ),
            })
            tasks.forEach((task) => {
              const dl = get().deals.find((deal) => deal.id === task.dealId)
              notify(
                [task.remindRole ?? 'rep'],
                `${task.due < todayPlus(0) ? 'Overdue follow-up' : 'Follow-up due today'}: ${task.title}${dl ? ` (${dl.company})` : ''}`,
                `deals/${task.dealId}`,
                task.remindUser,
              )
            })
          }
        },
        /** Add a task to a deal. */
        addTask: (task) => {
          set({ tasks: [{ ...task, id: uid(), done: false }, ...get().tasks] })
          log(task.dealId, `Task added: ${task.title}`)
        },
        /** Create a follow-up task that reminds the person who set it on the due date. */
        addFollowUp: (dealId, due, note) => {
          const d = get().deals.find((deal) => deal.id === dealId)
          if (!d) return
          const currentUser = get().users.find((user) => user.id === get().meId)
          const title = note?.trim() || `Follow up with ${d.client}`
          set({
            tasks: [
              {
                id: uid(),
                dealId,
                title,
                due,
                done: false,
                rep: d.rep,
                kind: 'followup',
                remindRole: get().role ?? undefined,
                remindUser: currentUser?.name,
              },
              ...get().tasks,
            ],
          })
          log(dealId, `Follow-up reminder set for ${due}: ${title}`)
          get().checkReminders()
        },
        /** Push a follow-up back by some days and re-arm its reminder. */
        snoozeTask: (id, days) => {
          const t = get().tasks.find((task) => task.id === id)
          if (!t) return
          const base = t.due > todayPlus(0) ? t.due : todayPlus(0)
          const newDueDate = new Date(new Date(base).getTime() + days * 864e5)
            .toISOString()
            .slice(0, 10)
          set({
            tasks: get().tasks.map((task) =>
              task.id === id ? { ...task, due: newDueDate, notified: false } : task,
            ),
          })
          log(t.dealId, `Follow-up snoozed to ${newDueDate}: ${t.title}`)
        },
        /** Tick a task off, or reopen it. */
        toggleTask: (id) =>
          set({
            tasks: get().tasks.map((task) =>
              task.id === id ? { ...task, done: !task.done } : task,
            ),
          }),
        /** Delete a task. */
        deleteTask: (id) => set({ tasks: get().tasks.filter((task) => task.id !== id) }),
        /** Change the approval limits or the payment reminder lead time. */
        setSettings: (changes) => set({ settings: { ...get().settings, ...changes } }),
        /** Add a blank product to the catalogue. */
        addProduct: () =>
          set({
            products: [
              ...get().products,
              {
                id: uid(),
                name: 'New product',
                list: 1000,
                min: 800,
                billing: 'One-time' as Billing,
              },
            ],
          }),
        /** Edit a catalogue product (name, list price, minimum price). */
        updateProduct: (id, changes) =>
          set({
            products: get().products.map((product) =>
              product.id === id ? { ...product, ...changes } : product,
            ),
          }),
        /** Remove a product from the catalogue. */
        deleteProduct: (id) =>
          set({ products: get().products.filter((product) => product.id !== id) }),
        /** Edit a deal's details. A change of risk level is written to the activity log. */
        updateDeal: (id, changes) => {
          const old = get().deals.find((deal) => deal.id === id)
          set({
            deals: get().deals.map((deal) => (deal.id === id ? { ...deal, ...changes } : deal)),
          })
          if (old && changes.risk && changes.risk !== old.risk)
            log(id, `Risk changed ${old.risk} → ${changes.risk}`)
        },
        /** Add a contact person to a deal. */
        addContact: (contact) => {
          set({ contacts: [...get().contacts, { ...contact, id: uid() }] })
          log(contact.dealId, `Contact ${contact.name} added`)
        },
        /** Remove a contact. */
        deleteContact: (id) =>
          set({ contacts: get().contacts.filter((contact) => contact.id !== id) }),
        /** Attach files to a deal. Only the name and size are stored. */
        addFiles: (dealId, f) => {
          set({ files: [...get().files, ...f.map((x) => ({ ...x, dealId, id: uid() }))] })
          log(dealId, `${f.length} file(s) uploaded`)
        },
        /** Remove an attached file. */
        deleteFile: (id) => set({ files: get().files.filter((file) => file.id !== id) }),
        /** Mark the bell notifications as read for a role (and for one user, when the reminder was personal). */
        markRead: (role, user) =>
          set({
            notifs: get().notifs.map((notification) =>
              notification.to === role && (!notification.user || notification.user === user)
                ? { ...notification, read: true }
                : notification,
            ),
          }),
        /** Log a call, meeting, email or note. If a next step and date are given, a follow-up task is created too. */
        addRecord: (dealId, type, text, by, changes) => {
          set({
            records: [
              {
                id: uid(),
                dealId,
                type,
                text,
                at: changes?.at ?? new Date().toISOString(),
                by,
                contact: changes?.contact,
                outcome: changes?.outcome,
                duration: changes?.duration,
                next: changes?.next,
                nextDue: changes?.nextDue,
              },
              ...get().records,
            ],
          })
          log(
            dealId,
            `${type} logged${changes?.outcome ? ` (${changes.outcome})` : ''}${changes?.contact ? ` with ${changes.contact}` : ''}: ${text.slice(0, 60)}`,
          )
          if (changes?.nextDue && changes.next?.trim())
            get().addFollowUp(dealId, changes.nextDue, changes.next.trim())
        },
        /** Save a social media account for a client. */
        addSocial: (dealId, platform, handle) => {
          set({ socials: [...get().socials, { id: uid(), dealId, platform, handle }] })
          log(dealId, `${platform} account added`)
        },
        /** Remove a saved social media account. */
        removeSocial: (id) =>
          set({ socials: get().socials.filter((account) => account.id !== id) }),
        /** Sign in as a role, or sign out when given null. */
        setRole: (role) => {
          try {
            if (role)
              sessionStorage.setItem('crm-session', JSON.stringify({ role, meId: get().meId }))
            else sessionStorage.removeItem('crm-session')
          } catch {}
          set({ role, meId: role ? get().meId : null })
        },
        /** Create a new quote for a deal (a copy of an earlier one if given) and return its id. */
        addQuote: (dealId, from) => {
          const n = get().quotes.length + 1
          const id = 'Q-' + String(n).padStart(3, '0')
          const quote: Quote = {
            id,
            dealId,
            version: from ? from.version + 1 : 1,
            status: 'Draft',
            items: from
              ? from.items.map((item) => ({ ...item, id: Math.random().toString(36).slice(2) }))
              : [makeItem('CRM License', 1, 1000, 1000)],
            log: [from ? `Duplicated from ${from.id}` : 'Created'],
            expires: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
            startDate: from?.startDate,
          }
          set({ quotes: [...get().quotes, quote] })
          log(dealId, `Quote ${id} created`)
          return id
        },
        /** Save edits to a quote. */
        saveQuote: (q) =>
          set({ quotes: get().quotes.map((quote) => (quote.id === q.id ? q : quote)) }),
        /** Send a quote for approval. Within the auto limit it is approved straight away. */
        submitForApproval: (id, reason) => {
          log(dealIdOfQuote(id), `Quote ${id} submitted`)
          const cq = get().quotes.find((quote) => quote.id === id)!
          const newDueDate = approverForQuote(cq, get().settings, get().products)
          const dl = get().deals.find((deal) => deal.id === cq.dealId)
          if (newDueDate !== 'auto')
            notify(
              newDueDate === 'admin' ? ['admin', 'ceo'] : ['ceo'],
              `${id} for ${dl?.company} needs approval (${discountPercent(cq).toFixed(1)}% off)`,
              `approvals`,
            )
          set({
            quotes: get().quotes.map((quote) => {
              if (quote.id !== id) return quote
              const n = approverForQuote(quote, get().settings, get().products)
              if (n === 'auto')
                return {
                  ...quote,
                  status: 'Approved',
                  need: undefined,
                  log: [...quote.log, 'Auto-approved (discount ≤ 5%)'],
                }
              return {
                ...quote,
                status: 'Pending approval',
                need: n,
                reason,
                log: [
                  ...quote.log,
                  `Approval requested (${discountPercent(quote).toFixed(1)}% off): ${reason}`,
                ],
              }
            }),
          })
        },
        /** Approve or reject a quote on behalf of Admin or CEO, with a comment. */
        decideApproval: (id, by, ok, comment) => {
          log(dealIdOfQuote(id), `Quote ${id} ${ok ? 'approved' : 'rejected'} by ${by}`)
          notify(
            ['rep'],
            `${id} was ${ok ? 'approved' : 'rejected'} by ${by}${comment ? ': ' + comment : ''}`,
            `deals/${dealIdOfQuote(id)}`,
          )
          set({
            quotes: get().quotes.map((quote) =>
              quote.id === id
                ? {
                    ...quote,
                    status: ok ? 'Approved' : 'Rejected',
                    log: [
                      ...quote.log,
                      `${ok ? 'Approved' : 'Rejected'} by ${by}${comment ? ': ' + comment : ''}`,
                    ],
                  }
                : quote,
            ),
          })
        },
        /** Move a quote between statuses (Sent, Accepted, Rejected...). */
        setQuoteStatus: (id, status) => {
          log(dealIdOfQuote(id), `Quote ${id} marked ${status}`)
          set({
            quotes: get().quotes.map((quote) =>
              quote.id === id ? { ...quote, status, log: [...quote.log, status] } : quote,
            ),
          })
        },
        /** Move a deal to another pipeline stage. Moving out of Closed clears the outcome and lost reason. */
        setDealStage: (id, s) => {
          set({
            deals: get().deals.map((deal) =>
              deal.id === id
                ? {
                    ...deal,
                    stage: s,
                    ...(s < 4
                      ? {
                          outcome: undefined,
                          lostReason: undefined,
                          closeNote: undefined,
                          closedAt: undefined,
                        }
                      : {}),
                  }
                : deal,
            ),
          })
          log(id, `Stage changed to ${STAGES[s]}`)
        },
      }
    },
    {
      name: 'crm-store',
      partialize: (state) => {
        const { role, meId, ...rest } = state
        return rest
      },
    },
  ),
)
