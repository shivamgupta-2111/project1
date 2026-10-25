# Pipeline CRM (frontend demo)
## Run
    npm install
    npm run dev      # http://localhost:3000
## Demo logins (password: demo123)
anita@demo.com (Rep) · admin@demo.com (Admin) · ceo@demo.com (CEO)
## Client demo script
1. Login as Rep → open Bluewave Foods → see the quote pending approval.
2. Create a new quote, cut the price by 20%, add a reason → Request approval.
3. Login as CEO (other tab) → bell alert → Approvals → Approve.
4. Back as Rep → quote unlocked → Mark sent → Accepted → Print / PDF.
5. Pipeline page → drag a card. Toggle dark mode. "Reset demo data" in the sidebar restores the sample data.
## Deploy
Push to GitHub → import on vercel.com → Deploy (no settings needed).
## Notes
Frontend only: data lives in the browser (localStorage). Approval tiers: lib/store.ts → needFor.
## Accounts
Admin/CEO → Team → Create rep account. The rep signs in on the login page with that email and password.
## Final quote → invoice
Quote Approved/Sent → "Mark as final" → deal amount updates, deal moves to Closed → Admin creates the invoice (deal page or Invoices page).
## Several roles at once
Each browser tab keeps its own login. Open Rep, Admin and CEO in three tabs; they share the same data and alerts.
## Subscriptions
Settings → Products → Billing: One-time, Monthly or Annual (ARR). Quotes show term in months, ARR and MRR.
## Closing a deal
Moving a deal to Closed asks: Deal done (green) or Cancelled (red), plus a required note. Cancelled deals appear under Churn.
## Payment reminders
Mark a quote Final → payment schedule is created (Monthly: one per month for the term; Annual/ARR: one per year). Payments page + dashboard + bell remind N days before due (Settings → Payment reminders). Admin marks paid.
## In-app tabs
Opening a deal or rep adds a numbered tab under the header. Click a tab to switch, double-click or the pencil to rename, X to close, Alt+1..9 to jump. Esc cancels a rename, closes pop-ups and the alert list, and clears search boxes.
## Payment reminders
Mark a quote with a Monthly or Annual product as Final: a payment schedule is created. Reminders start N days before each due date (Settings). See Dashboard, Payments page and the bell.
## Stages page
Sidebar → Stages. Tap a stage tile to list the clients in it. Reps see their own deals; Admin/CEO see all and can filter by rep.
## Message templates
Deal page → Message templates. Pick a template and contact, edit the text, then open it in WhatsApp or your email app. Needs a contact with a phone/email (Contact details). Each use is written to the audit log.
## Lost reasons
Cancelling a deal now requires a reason (dropdown) plus the note. Shown on the dashboard Churn box and in Reports (Admin/CEO): reasons by count and value, by rep, lost-deals table, CSV export.
## Audit log
Admin/CEO → Audit log. Every action records who did it and when. Filter by user, category, date or text, and export CSV.
## Design system
Flat, enterprise-style UI. All colours are tokens at the top of `app/globals.css` (`--brand`, `--bg`, `--card`, `--ink`, `--mute`). To re-brand, change ``--brand`, `--brand-solid`, `--brand-hover` and `--brand-light` (light and dark blocks). Corner radii live in `tailwind.config.js`. Font: Inter (loaded from Google Fonts, falls back to the system font offline).
## Duplicate check
New deal dialog and deal GST field warn about an existing deal with the same GST number or the same/similar company name (ignores Pvt/Ltd/case/punctuation, tolerates typos). It warns but never blocks: tick "This is a different client" to create anyway (logged in the audit log). Reports → "Possible duplicate clients" lists pairs already in the data. Logic: `lib/dupes.ts`.
## Call & meeting log
Deal page → "Call & meeting log": type, who with, when, duration, outcome, notes and an optional next step + date (creates a follow-up task automatically). Shows "last contact", filters by type, and feeds Reports → "Calls and meetings by rep".
## Follow-up reminders
Deal page → "Follow-up reminder": quick dates or a custom date + note. You get a bell notification on the due date (only you, not other users), it shows in Tasks with a Follow-up tag, and can be snoozed a day. Reminders are checked on load and every 5 minutes while the app is open.
## Rep profiles
Admin/CEO: click any rep name (deals, clients, stages, pipeline, tasks, reports, audit log, dashboard leaderboard) to open `/team/[id]` with Overview, Deals, Calls & meetings, Tasks, Activity and Profile tabs.
