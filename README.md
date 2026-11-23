# Warehouse ERP

ERP for our warehouse, built with Next.js. The warehouse has three parts: **Grocery**, **Bright Idea** and **Raw Material**. There are two logins, one for admins and one for reps (staff on the floor).

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Demo logins (the login page also has one-click buttons for these):

- Admin: `admin@erp.com` / `admin123`
- Rep: `rep@erp.com` / `rep123`

## What's in it

**Warehouse**

Hover over Warehouse in the sidebar and a popup shows the three sections.

- Grocery: inventory, shelf items, expiry, to order, backlog, suspicious activity (admin only), plus graphs.
- Bright Idea: product, supplier, region and quantity. Shows a low stock alert when quantity drops below the minimum.
- Raw Material: grain, pulses, vegetables and meat. Imports (arrival date, shelf life, quantity) and exports (shipment details, export date).

**Admin side**

- Dashboard with sales, purchases, stock value and alerts.
- Approvals: big stock adjustments, write-offs and exports made by reps wait here until an admin approves them. The limits are set in Settings.
- Purchase orders: create a PO, send it, then receive it when the goods come in. Receiving adds the stock and creates the supplier bill.
- Suppliers: contact details, on-time %, rating, price history and money owed.
- Rep performance: sales and task targets with progress bars.
- Reports (buying / selling / archives), accounts, users and settings.

**Rep side** (mostly used on phones, so there's a bottom tab bar)

- Scan: scan a barcode or QR with the phone camera. QR labels can be printed from the Labels page.
- My tasks: today's restocks, deliveries, shipments and anything the admin assigned.
- Quick entry: stock in, stock out, sale, or move to shelf.
- Stock count: count a location, and it shows the difference from the system.
- Shift handover: notes for the next shift.
- My performance.

## Things to know

- Data is saved in the browser (localStorage) for now, so every browser has its own copy. Settings → "Reset demo data" puts the sample data back.
- Logins are only for demo, and passwords are stored as plain text. **Don't use this with real data yet.** The plan is Postgres + Prisma, with NextAuth for login.
- The camera only works on https or localhost. To test on a phone over wifi, run `npx next dev --experimental-https`.

## Folders

```
app/
  login/
  [portal]/            admin or rep, same pages, different access
    warehouse/         grocery, bright-idea, raw-material
    approvals/ purchase-orders/ suppliers/ performance/
    tasks/ scan/ quick/ count/ handover/ labels/
    reports/ accounts/ users/ settings/
components/            sidebar, charts, scanner, forms
lib/
  types.ts             data types
  seed.ts              sample data
  store.tsx            app state + localStorage
  actions.ts           stock changes + approval logic
  perf.ts              rep and supplier stats
```

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run format`: format the code with Prettier
