# File structure

Pipeline CRM is a **Next.js 14 (App Router) + TypeScript + Tailwind CSS** app. There is no backend: all data lives in the browser (localStorage) and is managed by one Zustand store.

## The project at a glance

```text
crm/
├── app/
│   ├── [role]/
│   │   ├── approvals/
│   │   │   └── page.tsx        # Discount approval queue. Admin sees mid-range discounts, CEO sees everything.
│   │   ├── audit/
│   │   │   └── page.tsx        # Audit log (Admin and CEO): who did what and when, with filters and CSV export.
│   │   ├── clients/
│   │   │   └── page.tsx        # Client list with search; each card links to its deal.
│   │   ├── deals/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Deal detail: stage bar, owner, quotes with approval flow, invoices, follow-ups and the call log.
│   │   ├── invoices/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # A single invoice that can be printed or downloaded as PDF.
│   │   │   └── page.tsx        # List of invoices.
│   │   ├── payments/
│   │   │   └── page.tsx        # Payment schedule across all deals, with due dates and paid status.
│   │   ├── pipeline/
│   │   │   └── page.tsx        # Kanban board. Drag a deal between stages; closing opens the Won/Cancelled dialog.
│   │   ├── profile/
│   │   │   └── page.tsx        # A rep's own profile and target progress.
│   │   ├── reports/
│   │   │   └── page.tsx        # Reports (Admin and CEO): pipeline, discounts, win rate, lost reasons, calls, duplicates.
│   │   ├── settings/
│   │   │   └── page.tsx        # Settings (Admin and CEO): approval limits, product catalogue and reminder timing.
│   │   ├── stages/
│   │   │   └── page.tsx        # Pick a pipeline stage to see which clients are in it.
│   │   ├── tasks/
│   │   │   └── page.tsx        # Tasks and follow-ups, grouped by overdue, today and upcoming.
│   │   ├── team/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # One rep's full profile (Admin and CEO): overview, deals, calls, tasks, activity, details.
│   │   │   └── page.tsx        # Team list (Admin and CEO) and the form to create a new rep.
│   │   └── page.tsx            # Dashboard. Reps see their own deals, tasks and target; Admin and CEO see the whole company.
│   ├── globals.css             # Global styles: colour tokens (light and dark), buttons, inputs, cards, tables and print rules for invoices.
│   ├── layout.tsx              # Root layout: loads the font, sets up light/dark theme and mounts the toast messages.
│   ├── not-found.tsx           # Page shown for unknown URLs.
│   └── page.tsx                # Sign-in page, with one-click demo accounts for each role.
├── components/
│   ├── Avatar.tsx              # Round profile picture, or coloured initials when there is no photo.
│   ├── Bell.tsx                # Notification bell in the top bar.
│   ├── CloseDialog.tsx         # Dialog for closing a deal as Won or Cancelled (a cancelled deal needs a lost reason).
│   ├── DealInfo.tsx            # Deal details card: GST, contacts, files and notes.
│   ├── DealTabs.tsx            # Tabs under a deal: call and meeting log, activity, tasks and social accounts.
│   ├── FollowUp.tsx            # Follow-up reminder card on a deal, with quick dates and snooze.
│   ├── NewDeal.tsx             # "New deal" button and dialog, including the duplicate check.
│   ├── Num.tsx                 # Number input that lets you type freely.
│   ├── PhotoUpload.tsx         # Profile photo picker that crops and shrinks the image.
│   ├── QuickTask.tsx           # Small form for adding a task.
│   ├── RepLink.tsx             # A rep's name. Admin and CEO can click it to open the rep's profile.
│   ├── RepProgress.tsx         # Target progress, stats and editable details for a rep.
│   ├── Shell.tsx               # App frame: sidebar, top bar, tabs, mobile nav, session guard and reminder timer.
│   ├── TabBar.tsx              # Browser-style tabs for pages and deals that are open.
│   ├── tabs.ts                 # Store for the open in-app tabs (kept per browser tab).
│   ├── Templates.tsx           # Email and WhatsApp message templates filled in from the deal.
│   ├── Toaster.tsx             # Small pop-up message ("Saved", "Copied"...). Call toast("text") from anywhere.
│   └── useEsc.ts               # Hook: run a function when Escape is pressed.
├── lib/
│   ├── constants.ts            # Fixed lists used across the app (pipeline stages, dropdown options).
│   ├── deals.ts                # Helpers that answer questions about a deal (won, lost, how much it is worth).
│   ├── dupes.ts                # Duplicate detection for clients: same GST number, or the same or a similar company name.
│   ├── format.ts               # Number formatting helpers.
│   ├── invoicePdf.ts           # Draws an invoice as a PDF using jsPDF.
│   ├── payments.ts             # Builds the payment schedule that is created when a quote is marked final.
│   ├── pricing.ts              # Quote maths: line totals, discounts, GST and which role must approve a quote.
│   ├── seed.ts                 # Demo data the app starts with (also what "Reset demo data" brings back).
│   ├── store.ts                # The app's data store: every action that changes deals, quotes, tasks, invoices and so on. Saved to localStorage.
│   ├── types.ts                # Shared TypeScript types for the CRM.
│   ├── ui.ts                   # Shared style constants for the UI.
│   └── utils.ts                # Small helpers for ids and dates.
├── .prettierrc.json
├── file-structure.md
├── functions-and-variables.md
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── tsconfig.json
```

## Where do I change...?

| I want to change | Open |
|---|---|
| How a quote is priced, discounted or taxed | `lib/pricing.ts` |
| Who must approve a discount (default 5% / 15%) | `lib/pricing.ts` (rules) and `lib/seed.ts` (default limits) |
| What happens when a quote is marked final, an invoice is created, a deal is closed | `lib/store.ts` (`markQuoteFinal`, `createInvoice`, `closeDeal`) |
| The payment schedule for monthly / annual plans | `lib/payments.ts` |
| Duplicate-client detection rules | `lib/dupes.ts` |
| Pipeline stage names, lost reasons, call outcomes | `lib/constants.ts` |
| Demo data (users, deals, quotes) | `lib/seed.ts` |
| A data shape (add a field to a deal, task, ...) | `lib/types.ts`, then `lib/seed.ts` |
| Colours, buttons, inputs, dark mode | `app/globals.css` (design tokens at the top) and `tailwind.config.js` |
| The sidebar, top bar or which pages each role sees | `components/Shell.tsx` |
| Email / WhatsApp templates | `components/Templates.tsx` |
| Invoice PDF layout | `lib/invoicePdf.ts` (PDF) and `app/[role]/invoices/[id]/page.tsx` (on screen / print) |

## Routes and who can open them

Every page lives under `app/[role]/`, where `[role]` is `rep`, `admin` or `ceo`. The sidebar only shows each role the pages that suit it.

| URL | File | Rep | Admin | CEO |
|---|---|:-:|:-:|:-:|
| `/` (sign in) | `app/page.tsx` | - | - | - |
| `/[role]` (dashboard) | `app/[role]/page.tsx` | yes (own data) | yes (company) | yes (company) |
| `/[role]/pipeline` | `pipeline/page.tsx` | yes | yes | yes |
| `/[role]/stages` | `stages/page.tsx` | yes | yes | yes |
| `/[role]/clients` | `clients/page.tsx` | yes | yes | yes |
| `/[role]/tasks` | `tasks/page.tsx` | yes | yes | yes |
| `/[role]/deals/[id]` | `deals/[id]/page.tsx` | yes | yes | yes |
| `/[role]/invoices`, `/[role]/invoices/[id]` | `invoices/...` | view | view, create, mark paid | view |
| `/[role]/payments` | `payments/page.tsx` | view | view, mark paid | view |
| `/[role]/profile` ("My progress") | `profile/page.tsx` | yes | - | - |
| `/[role]/approvals` | `approvals/page.tsx` | - | mid-range discounts | all pending |
| `/[role]/team`, `/[role]/team/[id]` | `team/...` | - | yes | yes |
| `/[role]/reports` | `reports/page.tsx` | - | yes | yes |
| `/[role]/audit` | `audit/page.tsx` | - | yes | yes |
| `/[role]/settings` | `settings/page.tsx` | - | yes | yes |

## How data flows

1. A page or component calls `useStore()` (from `lib/store.ts`) to read data and call actions.
2. Actions update the store. Zustand's `persist` middleware saves it to `localStorage` under `crm-store`.
3. Who is signed in is kept separately in `sessionStorage` (`crm-session`), and the open in-app tabs in `sessionStorage` (`crm-tabs`). Neither is saved with the data.
4. `components/Shell.tsx` wraps every signed-in page. On load, and every 5 minutes, it calls `checkReminders()` to create payment and follow-up notifications.
5. "Reset demo data" in the sidebar deletes `crm-store`; on reload the store starts again from `lib/seed.ts`.

## Conventions

- **Imports:** `@/` means the project root (for example `import { useStore } from '@/lib/store'`).
- **Where code goes:** pure logic with no React in `lib/`; React pieces in `components/`; one folder per page under `app/[role]/`.
- **Naming:** domain words, singular for one thing and plural for a list (`deal`, `deals`, `quote`, `quotes`). Components are `PascalCase`, everything else `camelCase`.
- **Styling:** Tailwind classes in the JSX, shared building blocks (`.box`, `.btn`, `.btn2`, `.inp`, `.pill`) in `app/globals.css`.
- **Formatting:** Prettier, configured in `.prettierrc.json`. Run `npm run format`.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Demo sign-ins are on the sign-in page (one click per role).
