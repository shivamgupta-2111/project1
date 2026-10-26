# Functions and variables

A reference for the code. It is generated from the source, so signatures match what is in the files.

## 1. Where things are saved

| Key | Where | What |
|---|---|---|
| `crm-store` | `localStorage` | All CRM data (everything in section 4 except `meId` and `role`). |
| `crm-session` | `sessionStorage` | Who is signed in (`role` and `meId`) for this browser tab. |
| `crm-tabs` | `sessionStorage` | The open in-app tabs. |

## 2. Types (`lib/types.ts`)

### `Role`
The three kinds of user.

`'rep' | 'admin' | 'ceo'`

### `Billing`
How a quote line is charged: once, every month, or every year.

`'One-time' | 'Monthly' | 'Annual'`

### `Item`
One line on a quote: a product with quantity, list price, charged price, GST and billing type.

| Field | Type |
|---|---|
| `id` | `string` |
| `product` | `string` |
| `qty` | `number` |
| `list` | `number` |
| `price` | `number` |
| `gst` | `number` |
| `billing?` | `Billing` |
| `term?` | `number` |

### `QStatus`
Where a quote is in its life.

`'Draft' | 'Pending approval' | 'Approved' | 'Rejected' | 'Sent' | 'Accepted'`

### `Quote`
A priced proposal for a deal, made of items, with a version, status, approval log and expiry date.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `version` | `number` |
| `status` | `QStatus` |
| `items` | `Item[]` |
| `reason?` | `string` |
| `need?` | `'admin' \| 'ceo'` |
| `log` | `string[]` |
| `expires` | `string` |
| `final?` | `boolean` |
| `startDate?` | `string` |

### `Deal`
A sales opportunity with a client: stage, owner rep, risk, target date, outcome and lost reason.

| Field | Type |
|---|---|
| `id` | `string` |
| `company` | `string` |
| `client` | `string` |
| `rep` | `string` |
| `stage` | `number` |
| `risk` | `'Low' \| 'Medium' \| 'High'` |
| `gst` | `string` |
| `target` | `string` |
| `notes` | `string` |
| `amount?` | `number` |
| `outcome?` | `'Won' \| 'Cancelled'` |
| `lostReason?` | `string` |
| `closeNote?` | `string` |
| `closedAt?` | `string` |

### `Act`
One row of the activity log (also the audit log).

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `text` | `string` |
| `at` | `string` |
| `by?` | `string` |
| `byRole?` | `Role` |

### `Rec`
A logged call, meeting, email or note, with contact, outcome, duration and next step.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `type` | `'Call' \| 'Meeting' \| 'Email' \| 'Note'` |
| `text` | `string` |
| `at` | `string` |
| `by` | `string` |
| `contact?` | `string` |
| `outcome?` | `string` |
| `duration?` | `number` |
| `next?` | `string` |
| `nextDue?` | `string` |

### `Social`
A social media account saved for a client.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `platform` | `string` |
| `handle` | `string` |

### `Notif`
A bell notification for a role, or for one person when `user` is set.

| Field | Type |
|---|---|
| `id` | `string` |
| `to` | `Role` |
| `text` | `string` |
| `href` | `string` |
| `read` | `boolean` |
| `at` | `string` |
| `user?` | `string` |

### `Contact`
A contact person on a deal.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `name` | `string` |
| `phone` | `string` |
| `email` | `string` |

### `FileRec`
A file attached to a deal (only its name and size are stored).

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `name` | `string` |
| `size` | `number` |

### `User`
A person who can sign in.

| Field | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `email` | `string` |
| `password` | `string` |
| `role` | `Role` |
| `phone` | `string` |
| `city` | `string` |
| `target` | `number` |
| `photo?` | `string` |

### `Invoice`
An invoice raised from a final quote.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `quoteId` | `string` |
| `subtotal` | `number` |
| `gst` | `number` |
| `amount` | `number` |
| `date` | `string` |
| `due` | `string` |
| `status` | `'Unpaid' \| 'Paid'` |
| `by` | `string` |

### `Payment`
One scheduled payment from a final quote.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `quoteId` | `string` |
| `kind` | `'Monthly' \| 'Annual'` |
| `n` | `number` |
| `of` | `number` |
| `due` | `string` |
| `amount` | `number` |
| `status` | `'Due' \| 'Paid'` |
| `notified?` | `boolean` |

### `Task`
A to-do on a deal. A follow-up reminder is a task with `kind: "followup"`.

| Field | Type |
|---|---|
| `id` | `string` |
| `dealId` | `string` |
| `title` | `string` |
| `due` | `string` |
| `done` | `boolean` |
| `rep` | `string` |
| `kind?` | `'followup'` |
| `notified?` | `boolean` |
| `remindRole?` | `Role` |
| `remindUser?` | `string` |

### `Product`
A catalogue product with its list price and minimum price.

| Field | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `list` | `number` |
| `min` | `number` |
| `billing?` | `Billing` |

### `Settings`
Approval limits and payment reminder lead time.

| Field | Type |
|---|---|
| `auto` | `number` |
| `admin` | `number` |
| `remindDays?` | `number` |

## 3. Constants (`lib/constants.ts`)

| Name | Value |
|---|---|
| `OUTCOMES` | [ 'Interested', 'Needs follow-up', 'Deal progressed', 'Not interested', 'No answer', 'Left voicemail', ] |
| `PLATFORMS` | [ 'LinkedIn', 'Instagram', 'Facebook', 'X (Twitter)', 'YouTube', 'WhatsApp', 'Website', ] |
| `STAGES` | ['Discover', 'Identify', 'Next', 'Proposal', 'Closed'] |
| `LOST_REASONS` | [ 'Price too high', 'Chose a competitor', 'Budget frozen', 'Bad timing', 'No response', 'Product mismatch', 'Other', ] |

## 4. Store data (`lib/store.ts`, `CrmData`)

| Variable | Type | What it holds |
|---|---|---|
| `payments` | `Payment[]` | Scheduled payments from final quotes. |
| `users` | `User[]` | Everyone who can sign in (reps, admin, CEO), with targets and profile details. |
| `meId` | `string \| null` | Id of the signed-in user. Not saved to localStorage. |
| `invoices` | `Invoice[]` | Invoices raised from final quotes. |
| `tasks` | `Task[]` | To-dos and follow-up reminders. |
| `settings` | `Settings` | Approval limits (`auto`, `admin`) and `remindDays`. |
| `products` | `Product[]` | Product catalogue with list and minimum prices. |
| `contacts` | `Contact[]` | Contact people on deals. |
| `files` | `FileRec[]` | Files attached to deals. |
| `notifs` | `Notif[]` | Bell notifications. |
| `activity` | `Act[]` | The activity log, which is also the audit log. |
| `records` | `Rec[]` | Call, meeting, email and note log. |
| `socials` | `Social[]` | Social accounts saved for clients. |
| `role` | `Role \| null` | Role of the signed-in user. Not saved to localStorage. |
| `deals` | `Deal[]` | All deals. |
| `quotes` | `Quote[]` | All quotes. |

## 5. Store actions (`lib/store.ts`, `CrmActions`)

Read data with `const { deals } = useStore()`. Call actions the same way, for example `useStore.getState().closeDeal(id, 'Won', 'note')` outside React.

| Action | Returns | What it does |
|---|---|---|
| `markPaymentPaid(id: string, paid: boolean)` |  | Mark one scheduled payment as paid, or put it back to due. |
| `checkReminders()` |  | Send notifications for payments due soon or overdue, and for follow-ups that have come due. Runs on load and every 5 minutes. |
| `loadSession()` |  | Restore the signed-in user after a page refresh (the session lives in sessionStorage). |
| `closeDeal(id: string, outcome: 'Won' \| 'Cancelled', note: string, reason?: string)` |  | Close a deal as Won or Cancelled. A cancelled deal keeps its lost reason so Reports can break losses down. |
| `logActivity(dealId: string, text: string)` |  | Add a free-text line to the activity log. Shown in deal timelines and the audit log. |
| `login(email: string, password: string)` | `User \| null` | Check email and password. On success, remember the user for this browser session and return them. |
| `addUser(user: Omit<User, 'id' \| 'role'>)` | `string \| null` | Create a rep account. Returns an error message, or null when it worked. |
| `updateUser(id: string, changes: Partial<User>)` |  | Edit a user's profile (phone, city, target, photo). |
| `markQuoteFinal(quoteId: string)` |  | Make this the final quote: sets the deal amount, closes the deal as Won, builds the payment schedule and tells Admin and CEO. |
| `createInvoice(quoteId: string, by: string)` | `string` | Create an invoice for a final quote (due in 15 days) and return its id. |
| `setInvoicePaid(id: string, paid: boolean)` |  | Mark an invoice as paid or unpaid. |
| `addTask(task: Omit<Task, 'id' \| 'done'>)` |  | Add a task to a deal. |
| `addFollowUp(dealId: string, due: string, note?: string)` |  | Create a follow-up task that reminds the person who set it on the due date. |
| `snoozeTask(id: string, days: number)` |  | Push a follow-up back by some days and re-arm its reminder. |
| `toggleTask(id: string)` |  | Tick a task off, or reopen it. |
| `deleteTask(id: string)` |  | Delete a task. |
| `setSettings(changes: Partial<Settings>)` |  | Change the approval limits or the payment reminder lead time. |
| `addProduct()` |  | Add a blank product to the catalogue. |
| `updateProduct(id: string, changes: Partial<Product>)` |  | Edit a catalogue product (name, list price, minimum price). |
| `deleteProduct(id: string)` |  | Remove a product from the catalogue. |
| `addDeal(deal: Omit<Deal, 'id' \| 'stage'>)` | `string` | Create a deal in the Discover stage and return its id. |
| `updateDeal(id: string, changes: Partial<Deal>)` |  | Edit a deal's details. A change of risk level is written to the activity log. |
| `addContact(contact: Omit<Contact, 'id'>)` |  | Add a contact person to a deal. |
| `deleteContact(id: string)` |  | Remove a contact. |
| `addFiles(dealId: string, f: { name: string; size: number }[])` |  | Attach files to a deal. Only the name and size are stored. |
| `deleteFile(id: string)` |  | Remove an attached file. |
| `markRead(role: Role, user?: string)` |  | Mark the bell notifications as read for a role (and for one user, when the reminder was personal). |
| `addRecord(dealId: string, type: Rec['type'], text: string, by: string, extra?: Partial<Pick<Rec, 'contact' \| 'outcome' \| 'duration' \| 'next' \| 'nextDue' \| 'at'>>)` |  | Log a call, meeting, email or note. If a next step and date are given, a follow-up task is created too. |
| `addSocial(dealId: string, platform: string, handle: string)` |  | Save a social media account for a client. |
| `removeSocial(id: string)` |  | Remove a saved social media account. |
| `setRole(role: Role \| null)` |  | Sign in as a role, or sign out when given null. |
| `addQuote(dealId: string, from?: Quote)` | `string` | Create a new quote for a deal (a copy of an earlier one if given) and return its id. |
| `saveQuote(quote: Quote)` |  | Save edits to a quote. |
| `submitForApproval(id: string, reason: string)` |  | Send a quote for approval. Within the auto limit it is approved straight away. |
| `decideApproval(id: string, by: Role, ok: boolean, comment: string)` |  | Approve or reject a quote on behalf of Admin or CEO, with a comment. |
| `setQuoteStatus(id: string, status: QStatus)` |  | Move a quote between statuses (Sent, Accepted, Rejected...). |
| `setDealStage(id: string, s: number)` |  | Move a deal to another pipeline stage. Moving out of Closed clears the outcome and lost reason. |

Three small helpers inside the store are not exported: `log(dealId, text)` writes to the activity log with the current user's name, `dealIdOfQuote(quoteId)` finds a quote's deal, and `notify(roles, text, href, user?)` creates bell notifications.

## 6. Helper functions

### Pricing (`lib/pricing.ts`)

| Function | What it does |
|---|---|
| `billingMultiplier(item: Item)` | How many times a line's price is charged over its term: monthly lines bill every month, annual lines once a year, one-time lines once. |
| `lineTotal(item: Item)` | What the client pays for one line over its whole term, before GST. |
| `annualRecurringRevenue(quote: Quote)` | Yearly recurring revenue of a quote: monthly lines x 12 plus annual lines. One-time lines don't count. |
| `discountPercent(quote: Quote)` | Overall discount on a quote: list price versus the price actually charged. |
| `lineListAmount(item: Item)` | What one line would cost at list price, before GST. |
| `lineDiscountPercent(item: Item)` | Discount on a single line compared with its list price. |
| `quoteListTotal(quote: Quote)` | Whole quote at list price, before GST. |
| `quoteSubtotal(quote: Quote)` | Whole quote at the price the client pays, before GST. |
| `quoteDiscountAmount(quote: Quote)` | Rupees given away as discount on the quote. |
| `quoteTotal(quote: Quote)` | Amount the client pays: every line plus its GST. |
| `approverForDiscount(percent: number, limits: Settings = { auto: 5, admin: 15 })` | Who must approve a discount: auto-approved up to the first limit, Admin or CEO up to the second, CEO only above it. |
| `hasPriceBelowMinimum(quote: Quote, products: Product[])` | True if any line is priced below the minimum price set for that product in Settings. |
| `approverForQuote(quote: Quote, limits: Settings, products: Product[])` | Who must approve a quote. A price below a product's minimum always needs the CEO; otherwise it depends on the discount. |
| `makeItem(product: string, qty: number, list: number, price: number, billing: Billing = 'One-time', term = 1)` | A quote line with the default 18% GST. Used for the demo data and for new quotes. |

### Deals (`lib/deals.ts`)

| Function | What it does |
|---|---|
| `isWon(deal: Deal)` | A deal is won when it reached the Closed stage and was not cancelled. |
| `isLost(deal: Deal)` | A deal is lost when it reached the Closed stage and was cancelled. |
| `dealValue(allQuotes: Quote[], dealId: string)` | What a deal is worth: the final (or accepted) quote if there is one, otherwise the biggest open quote. |

### Payment schedule (`lib/payments.ts`)

| Function | What it does |
|---|---|
| `buildPaymentSchedule(dealId: string, quoteId: string, items: Item[], start: string)` | Builds the payments created when a quote is marked final. Monthly lines bill every month for their term; annual lines bill once per year. Amounts include GST. |

### Duplicates (`lib/dupes.ts`)

| Function | What it does |
|---|---|
| `normalizeCompanyName(name: string)` | Lower-cases a company name and drops punctuation and legal suffixes so similar names compare equal. |
| `findDupes(deals: Deal[], query: { company?: string; gst?: string })` | Looks for existing deals that might be the same client as a company name and/or GST number. |
| `dupePairs(deals: Deal[])` | Every pair of existing deals that look like the same client (used by the Reports page). |

### Dates and ids (`lib/utils.ts`)

| Function | What it does |
|---|---|
| `todayPlus(days: number)` | Today's date plus `days` (use a negative number for the past), as "YYYY-MM-DD". |
| `uid()` | A short random id. Good enough for a browser-only demo. |
| `addMonths(isoDate: string, months: number)` | Adds months to a "YYYY-MM-DD" date. If the day doesn't exist in the target month it moves to the month's last day (31 Jan + 1 month = 28 Feb). |

### Formatting (`lib/format.ts`) and styles (`lib/ui.ts`)

| Function | What it does |
|---|---|
| `formatINR(amount: number)` | Number formatting helpers. |

`RISK_STYLES` in `lib/ui.ts` maps a deal's risk (`Low`, `Medium`, `High`) to its badge colours.

## 7. Components (`components/`)

| Component | Props | What it is |
|---|---|---|
| `Avatar` | `{ name: string photo?: string size?: number }` | Round profile picture, or coloured initials when there is no photo. |
| `Bell` | `{ role: Role }` | Notification bell in the top bar. |
| `CloseDialog` | - | Dialog for closing a deal as Won or Cancelled (a cancelled deal needs a lost reason). |
| `DealInfo` | `{ dealId: string }` | Deal details card: GST, contacts, files and notes. |
| `DealTabs` | `{ dealId: string; who: string }` | Tabs under a deal: call and meeting log, activity, tasks and social accounts. |
| `FollowUp` | `{ dealId: string }` | Follow-up reminder card on a deal, with quick dates and snooze. |
| `NewDeal` | `{ role: Role }` | "New deal" button and dialog, including the duplicate check. |
| `Num` | `{ value: number; onChange: (v: string) => void } & Omit< React.InputHTMLAttributes<HTMLInputElement>, 'value' \| 'onChange' \| 'type' >` | Number input that lets you type freely. |
| `PhotoUpload` | `{ user: User }` | Profile photo picker that crops and shrinks the image. |
| `QuickTask` | `{ role?: Role; dealId?: string }` | Small form for adding a task. |
| `RepLink` | `{ name: string; className?: string }` | A rep's name. Admin and CEO can click it to open the rep's profile. |
| `RepProgress` | `{ user: User manager: boolean progress?: boolean details?: boolean }` | Target progress, stats and editable details for a rep. |
| `Shell` | `{ role: Role children: React.ReactNode wide?: boolean }` | App frame: sidebar, top bar, tabs, mobile nav, session guard and reminder timer. |
| `TabBar` | `{ role: Role; path: string }` | Browser-style tabs for pages and deals that are open. |
| `Templates` | `{ dealId: string; who: string }` | Email and WhatsApp message templates filled in from the deal. |
| `Toaster` | - | Small pop-up message ("Saved", "Copied"...). Call toast("text") from anywhere. |

Shared hooks and stores: `useEsc(active, onEscape)` runs a function on Escape, `toast(message)` shows a pop-up from anywhere, and `useTabs` (in `components/tabs.ts`) holds the open in-app tabs.

## 8. Local state in pages and components

These are the `useState` variables, as `value` / `setter`, with their starting value.

| File | Variable | Starts as |
|---|---|---|
| `app/page.tsx` | `email` / `setEmail` | `''` |
| `app/page.tsx` | `password` / `setPassword` | `''` |
| `app/page.tsx` | `err` / `setErr` | `''` |
| `components/Bell.tsx` | `open` / `setOpen` | `false` |
| `components/Bell.tsx` | `toast` / `setToast` | `null` |
| `components/CloseDialog.tsx` | `out` / `setOut` | `pre \|\| deal.outcome \|\| 'Won'` |
| `components/CloseDialog.tsx` | `note` / `setNote` | `deal.closeNote \|\| ''` |
| `components/CloseDialog.tsx` | `reason` / `setReason` | `deal.lostReason \|\| ''` |
| `components/DealInfo.tsx` | `comments` / `setComments` | `{ name: '', phone: '', email: '' }` |
| `components/DealInfo.tsx` | `isDraggingOver` / `setIsDraggingOver` | `false` |
| `components/DealTabs.tsx` | `tab` / `setTab` | `'Call log'` |
| `components/DealTabs.tsx` | `form` / `setForm` | `blank` |
| `components/DealTabs.tsx` | `typeFilter` / `setTypeFilter` | `'All'` |
| `components/DealTabs.tsx` | `platform` / `setPlatform` | `PLATFORMS[0]` |
| `components/DealTabs.tsx` | `handle` / `setHandle` | `''` |
| `components/FollowUp.tsx` | `due` / `setDue` | `iso(3)` |
| `components/FollowUp.tsx` | `note` / `setNote` | `''` |
| `components/NewDeal.tsx` | `open` / `setOpen` | `false` |
| `components/NewDeal.tsx` | `form` / `setForm` | `{ company: '', client: '', gst: '', target: '', re` |
| `components/NewDeal.tsx` | `confirmedDuplicate` / `setConfirmedDuplicate` | `false` |
| `components/Num.tsx` | `draft` / `setDraft` | `null` |
| `components/QuickTask.tsx` | `title` / `setTitle` | `''` |
| `components/QuickTask.tsx` | `selectedDealId` / `setSelectedDealId` | `''` |
| `components/QuickTask.tsx` | `due` / `setDue` | `today` |
| `components/RepProgress.tsx` | `form` / `setForm` | `{ phone: user.phone, city: user.city, target: user` |
| `components/Shell.tsx` | `ok` / `setOk` | `false` |
| `components/TabBar.tsx` | `edit` / `setEdit` | `null` |
| `components/Templates.tsx` | `templateId` / `setTemplateId` | `start` |
| `components/Templates.tsx` | `channel` / `setChannel` | `'WhatsApp'` |
| `components/Templates.tsx` | `contactIndex` / `setContactIndex` | `0` |
| `components/Templates.tsx` | `subject` / `setSubject` | `''` |
| `components/Templates.tsx` | `body` / `setBody` | `''` |
| `app/[role]/page.tsx` | `search` / `setSearch` | `''` |
| `app/[role]/approvals/page.tsx` | `comments` / `setComments` | `{}` |
| `app/[role]/audit/page.tsx` | `search` / `setSearch` | `''` |
| `app/[role]/audit/page.tsx` | `userFilter` / `setUserFilter` | `'All'` |
| `app/[role]/audit/page.tsx` | `categoryFilter` / `setCategoryFilter` | `'All'` |
| `app/[role]/audit/page.tsx` | `fromDate` / `setFromDate` | `''` |
| `app/[role]/audit/page.tsx` | `toDate` / `setToDate` | `''` |
| `app/[role]/audit/page.tsx` | `visibleCount` / `setVisibleCount` | `50` |
| `app/[role]/clients/page.tsx` | `search` / `setSearch` | `''` |
| `app/[role]/payments/page.tsx` | `tab` / `setTab` | `'All'` |
| `app/[role]/pipeline/page.tsx` | `draggedDealId` / `setDraggedDealId` | `null` |
| `app/[role]/pipeline/page.tsx` | `dragOverColumn` / `setDragOverColumn` | `null` |
| `app/[role]/stages/page.tsx` | `selectedStage` / `setSelectedStage` | `0` |
| `app/[role]/stages/page.tsx` | `repFilter` / `setRepFilter` | `'All'` |
| `app/[role]/stages/page.tsx` | `search` / `setSearch` | `''` |
| `app/[role]/tasks/page.tsx` | `form` / `setForm` | `{ title: '', dealId: '', due: today }` |
| `app/[role]/team/page.tsx` | `form` / `setForm` | `{ name: '', email: '', password: '', phone: '', ci` |
| `app/[role]/team/page.tsx` | `err` / `setErr` | `''` |
| `app/[role]/deals/[id]/page.tsx` | `selectedQuoteId` / `setSelectedQuoteId` | `null` |
| `app/[role]/deals/[id]/page.tsx` | `reason` / `setReason` | `''` |
| `app/[role]/team/[id]/page.tsx` | `tab` / `setTab` | `'Overview'` |

## 9. Naming cheat sheet

| Name | Meaning |
|---|---|
| `deal`, `deals` | A deal / the list of deals |
| `quote`, `item` | A quote / one line on it |
| `isManager` | The signed-in role is Admin or CEO (not a rep) |
| `rep` (on a deal) | The owner's name. It matches `User.name`, which is how `RepLink` finds the profile. |
| `stage` | Pipeline position, 0 to 4 (Discover, Identify, Next, Proposal, Closed) |
| `outcome` | `'Won'` or `'Cancelled'` once a deal is in stage 4 |
| `kind: 'followup'` | Marks a task as a follow-up reminder |
