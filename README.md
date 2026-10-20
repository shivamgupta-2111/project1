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
