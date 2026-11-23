"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Toast } from "@/components/StockAction";
import {
  ArrowRightLeft,
  CheckCircle2,
  Download,
  PackagePlus,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { BacklogStatus, GroceryItem } from "@/lib/types";
import { Badge, Card, Field, Modal, NoAccess, PageHeader, StatCard, TabLinks, Table } from "@/components/ui";
import { BarChartBox } from "@/components/charts";
import { groceryByCategory } from "@/lib/analytics";
import {
  SECTION_META,
  addDays,
  daysUntil,
  downloadCsv,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  fmtNum,
  isLow,
  isoDate,
  today,
  totalQty,
  uid,
} from "@/lib/utils";

const COLOR = SECTION_META.grocery.color;

export default function GroceryPage() {
  const { tab, portal } = useParams<{ tab: string; portal: string }>();
  const { data, user } = useStore();
  if (!user!.sections.includes("grocery")) return <NoAccess />;
  const isAdmin = user!.role === "admin";
  const base = `/${portal}/warehouse/grocery`;

  const expiredCount = data.grocery.filter(
    (g) => daysUntil(g.expiryDate) <= data.settings.expiryWarningDays,
  ).length;
  const tabs = [
    { href: `${base}/overview`, label: "Overview" },
    { href: `${base}/inventory`, label: "Inventory", count: data.grocery.length },
    { href: `${base}/shelf`, label: "Shelf items" },
    { href: `${base}/expiry`, label: "Expiry", count: expiredCount },
    { href: `${base}/to-order`, label: "To order", count: data.grocery.filter(isLow).length },
    {
      href: `${base}/backlog`,
      label: "Backlog",
      count: data.backlog.filter((b) => b.status !== "done").length,
    },
    ...(isAdmin
      ? [
          {
            href: `${base}/suspicious`,
            label: "Suspicious activity",
            count: data.activity.filter((a) => a.suspicious && !a.reviewed).length,
          },
        ]
      : []),
  ];

  const views: Record<string, React.ReactNode> = {
    overview: <Overview />,
    inventory: <Inventory />,
    shelf: <Shelf />,
    expiry: <Expiry />,
    "to-order": <ToOrder />,
    backlog: <Backlog />,
    suspicious: isAdmin ? <Suspicious /> : <NoAccess />,
  };

  return (
    <div>
      <PageHeader title="Grocery" subtitle={SECTION_META.grocery.blurb} accent={COLOR} />
      <TabLinks tabs={tabs} active={`${base}/${tab}`} />
      {views[tab] ?? <NoAccess />}
    </div>
  );
}

function Overview() {
  const { data } = useStore();
  const cats = useMemo(() => groceryByCategory(data), [data]);
  const value = data.grocery.reduce((s, g) => s + totalQty(g) * g.costPrice, 0);
  const retail = data.grocery.reduce((s, g) => s + totalQty(g) * g.sellPrice, 0);
  const topValue = [...data.grocery]
    .map((g) => ({ name: g.name, value: totalQty(g) * g.costPrice }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const buckets = [
    { label: "Expired", test: (d: number) => d < 0 },
    { label: "0–7 days", test: (d: number) => d >= 0 && d <= 7 },
    { label: "8–30 days", test: (d: number) => d > 7 && d <= 30 },
    { label: "31–90 days", test: (d: number) => d > 30 && d <= 90 },
    { label: "90+ days", test: (d: number) => d > 90 },
  ].map((b) => ({
    bucket: b.label,
    items: data.grocery.filter((g) => b.test(daysUntil(g.expiryDate))).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Stock value (cost)"
          value={fmtMoney(value)}
          hint={`Retail value ${fmtMoney(retail)}`}
        />
        <StatCard
          label="Units in store room"
          value={fmtNum(data.grocery.reduce((s, g) => s + g.storeQty, 0))}
        />
        <StatCard label="Units on shelf" value={fmtNum(data.grocery.reduce((s, g) => s + g.shelfQty, 0))} />
        <StatCard
          label="Need re-order"
          value={data.grocery.filter(isLow).length}
          tone="warn"
          hint="At or below re-order level"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Stock by category" subtitle="Store room vs shelf (units)">
          <BarChartBox
            data={cats}
            xKey="category"
            stacked
            series={[
              { key: "store", label: "Store room", color: "#2a78d6" },
              { key: "shelf", label: "On shelf", color: "#1baf7a" },
            ]}
          />
        </Card>
        <Card title="Expiry timeline" subtitle="Number of items by time left">
          <BarChartBox
            data={buckets}
            xKey="bucket"
            series={[{ key: "items", label: "Items", color: "#eb6834" }]}
          />
        </Card>
      </div>
      <Card title="Top items by stock value" subtitle="At cost price">
        <BarChartBox
          data={topValue}
          xKey="name"
          horizontal
          money
          height={320}
          series={[{ key: "value", label: "Value", color: COLOR }]}
        />
      </Card>
    </div>
  );
}

const emptyItem = (): GroceryItem => ({
  id: uid(),
  sku: "",
  name: "",
  category: "Staples",
  supplier: "",
  storeQty: 0,
  shelfQty: 0,
  reorderLevel: 20,
  unit: "pack",
  costPrice: 0,
  sellPrice: 0,
  expiryDate: isoDate(addDays(today(), 90)),
  addedOn: isoDate(today()),
  barcode: `890${Date.now().toString().slice(-10)}`,
});

function ItemForm({ initial, onSave }: { initial: GroceryItem; onSave: (g: GroceryItem) => void }) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof GroceryItem>(k: K, v: GroceryItem[K]) => setF((p) => ({ ...p, [k]: v }));
  const num = (k: keyof GroceryItem) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, Number(e.target.value) as never);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className="grid grid-cols-2 gap-3"
    >
      <div className="col-span-2">
        <Field label="Product name">
          <input className="input" required value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
      </div>
      <Field label="SKU">
        <input className="input" value={f.sku} onChange={(e) => set("sku", e.target.value)} />
      </Field>
      <Field label="Barcode">
        <input className="input" value={f.barcode} onChange={(e) => set("barcode", e.target.value)} />
      </Field>
      <Field label="Category">
        <input
          className="input"
          list="gcats"
          value={f.category}
          onChange={(e) => set("category", e.target.value)}
        />
      </Field>
      <Field label="Supplier">
        <input className="input" value={f.supplier} onChange={(e) => set("supplier", e.target.value)} />
      </Field>
      <Field label="Unit">
        <input className="input" value={f.unit} onChange={(e) => set("unit", e.target.value)} />
      </Field>
      <Field label="Store room qty">
        <input className="input" type="number" min={0} value={f.storeQty} onChange={num("storeQty")} />
      </Field>
      <Field label="Shelf qty">
        <input className="input" type="number" min={0} value={f.shelfQty} onChange={num("shelfQty")} />
      </Field>
      <Field label="Re-order level">
        <input
          className="input"
          type="number"
          min={0}
          value={f.reorderLevel}
          onChange={num("reorderLevel")}
        />
      </Field>
      <Field label="Expiry date">
        <input
          className="input"
          type="date"
          value={f.expiryDate}
          onChange={(e) => set("expiryDate", e.target.value)}
        />
      </Field>
      <Field label="Cost price (₹)">
        <input className="input" type="number" min={0} value={f.costPrice} onChange={num("costPrice")} />
      </Field>
      <Field label="Selling price (₹)">
        <input className="input" type="number" min={0} value={f.sellPrice} onChange={num("sellPrice")} />
      </Field>
      <datalist id="gcats">
        {[
          "Staples",
          "Oils",
          "Dairy",
          "Bakery",
          "Snacks",
          "Beverages",
          "Spices",
          "Household",
          "Personal Care",
          "Sauces",
        ].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="col-span-2 mt-2 flex justify-end">
        <button className="btn-primary">Save item</button>
      </div>
    </form>
  );
}

function QtyDialog({
  title,
  label,
  max,
  withReason,
  onSubmit,
  onClose,
}: {
  title: string;
  label: string;
  max?: number;
  withReason?: boolean;
  onSubmit: (qty: number, reason: string) => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  return (
    <Modal open onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(qty, reason);
        }}
        className="space-y-3"
      >
        <Field label={label}>
          <input
            className="input"
            type="number"
            min={withReason ? undefined : 1}
            max={max}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            autoFocus
          />
        </Field>
        {max !== undefined && <p className="text-xs text-slate-500">Available: {max}</p>}
        {withReason && (
          <Field label="Reason">
            <input
              className="input"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Count correction, damaged"
            />
          </Field>
        )}
        <div className="flex justify-end">
          <button className="btn-primary">Confirm</button>
        </div>
      </form>
    </Modal>
  );
}

function Inventory() {
  const { data, update, user, logActivity, submit } = useStore();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clearResult = useCallback(() => setResult(null), []);
  const isAdmin = user!.role === "admin";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [editing, setEditing] = useState<GroceryItem | null>(null);
  const [dialog, setDialog] = useState<{ kind: "receive" | "adjust"; item: GroceryItem } | null>(null);

  const cats = ["All", ...new Set(data.grocery.map((g) => g.category))];
  const rows = data.grocery.filter(
    (g) =>
      (cat === "All" || g.category === cat) &&
      (g.name + g.sku + g.supplier).toLowerCase().includes(q.toLowerCase()),
  );

  const save = (g: GroceryItem) => {
    const exists = data.grocery.some((x) => x.id === g.id);
    update((d) => {
      if (exists) d.grocery = d.grocery.map((x) => (x.id === g.id ? g : x));
      else d.grocery.unshift({ ...g, sku: g.sku || `GR-${1001 + d.grocery.length}` });
    });
    if (!exists)
      logActivity({ section: "grocery", action: "New item added", itemName: g.name, delta: totalQty(g) });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search name, SKU, supplier…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            className="btn-ghost"
            onClick={() =>
              downloadCsv(
                "grocery-inventory.csv",
                rows.map((g) => ({
                  SKU: g.sku,
                  Name: g.name,
                  Category: g.category,
                  Supplier: g.supplier,
                  Store: g.storeQty,
                  Shelf: g.shelfQty,
                  Reorder: g.reorderLevel,
                  Expiry: g.expiryDate,
                  Cost: g.costPrice,
                  Price: g.sellPrice,
                })),
              )
            }
          >
            <Download size={16} /> CSV
          </button>
          <button className="btn-primary" onClick={() => setEditing(emptyItem())}>
            <Plus size={16} /> Add item
          </button>
        </div>
      </div>

      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Item</th>
            <th className="th">Category</th>
            <th className="th text-right">Store room</th>
            <th className="th text-right">Shelf</th>
            <th className="th text-right">Total</th>
            <th className="th">Status</th>
            <th className="th">Expiry</th>
            <th className="th text-right">Cost / Price</th>
            <th className="th no-print" />
          </tr>
        }
      >
        {rows.map((g) => {
          const d = daysUntil(g.expiryDate);
          return (
            <tr key={g.id} className="hover:bg-slate-50">
              <td className="td">
                <p className="font-medium text-slate-900">{g.name}</p>
                <p className="text-xs text-slate-500">
                  {g.sku} · {g.supplier}
                </p>
              </td>
              <td className="td">{g.category}</td>
              <td className="td text-right tabular-nums">{g.storeQty}</td>
              <td className="td text-right tabular-nums">{g.shelfQty}</td>
              <td className="td text-right font-medium tabular-nums">{totalQty(g)}</td>
              <td className="td">
                {isLow(g) ? <Badge tone="warn">Low stock</Badge> : <Badge tone="good">In stock</Badge>}
              </td>
              <td className="td">
                <span className={d < 0 ? "font-medium text-red-700" : d <= 15 ? "text-amber-700" : ""}>
                  {fmtDate(g.expiryDate)}
                </span>
              </td>
              <td className="td text-right tabular-nums">
                ₹{g.costPrice} / ₹{g.sellPrice}
              </td>
              <td className="td no-print">
                <div className="flex justify-end gap-1">
                  <button
                    title="Receive stock"
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => setDialog({ kind: "receive", item: g })}
                  >
                    <PackagePlus size={16} />
                  </button>
                  <button
                    title="Adjust count"
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => setDialog({ kind: "adjust", item: g })}
                  >
                    <ArrowRightLeft size={16} />
                  </button>
                  <button
                    title="Edit"
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => setEditing(g)}
                  >
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      title="Delete"
                      className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (!confirm(`Delete ${g.name}?`)) return;
                        update((d) => {
                          d.grocery = d.grocery.filter((x) => x.id !== g.id);
                        });
                        logActivity({
                          section: "grocery",
                          action: "Item deleted",
                          itemName: g.name,
                          delta: -totalQty(g),
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && data.grocery.some((x) => x.id === editing.id) ? "Edit item" : "Add item"}
      >
        {editing && <ItemForm initial={editing} onSave={save} />}
      </Modal>

      {dialog && (
        <QtyDialog
          title={
            dialog.kind === "receive"
              ? `Receive stock – ${dialog.item.name}`
              : `Adjust store-room count – ${dialog.item.name}`
          }
          label={dialog.kind === "receive" ? "Quantity received" : "Change (+ / −)"}
          withReason={dialog.kind === "adjust"}
          onClose={() => setDialog(null)}
          onSubmit={(qty, reason) => {
            const it = dialog.item;
            if (!qty) return;
            setResult(
              submit(
                dialog.kind === "receive"
                  ? { type: "grocery-receive", itemId: it.id, qty }
                  : { type: "grocery-adjust", itemId: it.id, delta: qty, reason, where: "storeQty" },
              ),
            );
            setDialog(null);
          }}
        />
      )}
      <Toast result={result} onDone={clearResult} />
    </div>
  );
}

function Shelf() {
  const { data, submit } = useStore();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clearResult = useCallback(() => setResult(null), []);
  const [dialog, setDialog] = useState<{ kind: "move" | "sell"; item: GroceryItem } | null>(null);
  const rows = [...data.grocery].sort((a, b) => a.shelfQty - b.shelfQty);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Move stock from the store room onto shelves, and record sales from the shelf. Items with fewer than 10
        units on the shelf are marked for restocking.
      </p>
      <Table
        head={
          <tr>
            <th className="th">Item</th>
            <th className="th text-right">On shelf</th>
            <th className="th text-right">In store room</th>
            <th className="th">Shelf status</th>
            <th className="th text-right">Price</th>
            <th className="th no-print" />
          </tr>
        }
      >
        {rows.map((g) => (
          <tr key={g.id} className="hover:bg-slate-50">
            <td className="td font-medium text-slate-900">{g.name}</td>
            <td className="td text-right tabular-nums">{g.shelfQty}</td>
            <td className="td text-right tabular-nums">{g.storeQty}</td>
            <td className="td">
              {g.shelfQty === 0 ? (
                <Badge tone="danger">Empty shelf</Badge>
              ) : g.shelfQty < 10 ? (
                <Badge tone="warn">Restock</Badge>
              ) : (
                <Badge tone="good">OK</Badge>
              )}
            </td>
            <td className="td text-right tabular-nums">₹{g.sellPrice}</td>
            <td className="td no-print">
              <div className="flex justify-end gap-2">
                <button
                  className="btn-ghost px-2.5 py-1.5 text-xs"
                  disabled={!g.storeQty}
                  onClick={() => setDialog({ kind: "move", item: g })}
                >
                  <ArrowRightLeft size={14} /> To shelf
                </button>
                <button
                  className="btn-ghost px-2.5 py-1.5 text-xs"
                  disabled={!g.shelfQty}
                  onClick={() => setDialog({ kind: "sell", item: g })}
                >
                  <ShoppingCart size={14} /> Sell
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {dialog && (
        <QtyDialog
          title={
            dialog.kind === "move"
              ? `Move to shelf – ${dialog.item.name}`
              : `Record sale – ${dialog.item.name}`
          }
          label="Quantity"
          max={dialog.kind === "move" ? dialog.item.storeQty : dialog.item.shelfQty}
          onClose={() => setDialog(null)}
          onSubmit={(qty) => {
            const it = dialog.item;
            const lim = dialog.kind === "move" ? it.storeQty : it.shelfQty;
            const n = Math.min(Math.max(1, qty), lim);
            setResult(
              submit(
                dialog.kind === "move"
                  ? { type: "grocery-move", itemId: it.id, qty: n }
                  : { type: "grocery-sell", itemId: it.id, qty: n },
              ),
            );
            setDialog(null);
          }}
        />
      )}
      <Toast result={result} onDone={clearResult} />
    </div>
  );
}

function Expiry() {
  const { data, submit } = useStore();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clearResult = useCallback(() => setResult(null), []);
  const warn = data.settings.expiryWarningDays;
  const sorted = [...data.grocery].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  const groups = [
    { title: "Expired", tone: "danger" as const, items: sorted.filter((g) => daysUntil(g.expiryDate) < 0) },
    {
      title: `Expiring within ${warn} days`,
      tone: "warn" as const,
      items: sorted.filter((g) => {
        const d = daysUntil(g.expiryDate);
        return d >= 0 && d <= warn;
      }),
    },
    {
      title: `Expiring in ${warn + 1}–60 days`,
      tone: "info" as const,
      items: sorted.filter((g) => {
        const d = daysUntil(g.expiryDate);
        return d > warn && d <= 60;
      }),
    },
  ];

  const writeOff = (g: GroceryItem) => {
    if (!confirm(`Write off all ${totalQty(g)} units of ${g.name}?`)) return;
    setResult(submit({ type: "grocery-writeoff", itemId: g.id, qty: totalQty(g), reason: "Expired" }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {groups.map((g) => (
          <StatCard
            key={g.title}
            label={g.title}
            value={g.items.length}
            tone={g.tone === "info" ? "default" : g.tone}
          />
        ))}
      </div>
      {groups.map((grp) => (
        <Card key={grp.title} title={grp.title}>
          {grp.items.length === 0 ? (
            <p className="text-sm text-slate-500">None.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="th pl-0">Item</th>
                    <th className="th">Expiry date</th>
                    <th className="th">Time left</th>
                    <th className="th text-right">Units</th>
                    <th className="th text-right">Value at risk</th>
                    <th className="th no-print" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grp.items.map((g) => {
                    const d = daysUntil(g.expiryDate);
                    return (
                      <tr key={g.id}>
                        <td className="td pl-0 font-medium text-slate-900">{g.name}</td>
                        <td className="td">{fmtDate(g.expiryDate)}</td>
                        <td className="td">
                          <Badge tone={grp.tone}>
                            {d < 0 ? `${-d} days ago` : d === 0 ? "Today" : `${d} days`}
                          </Badge>
                        </td>
                        <td className="td text-right tabular-nums">{totalQty(g)}</td>
                        <td className="td text-right tabular-nums">{fmtMoney(totalQty(g) * g.costPrice)}</td>
                        <td className="td no-print text-right">
                          {d < 0 && totalQty(g) > 0 && (
                            <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => writeOff(g)}>
                              Write off
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
      <Toast result={result} onDone={clearResult} />
    </div>
  );
}

function ToOrder() {
  const { data, update, user } = useStore();
  const isAdmin = user!.role === "admin";
  const low = data.grocery.filter(isLow);
  const newItems = data.grocery.filter((g) => daysUntil(g.addedOn) >= -30);
  const openPOs = data.purchaseOrders.filter(
    (p) => p.section === "grocery" && ["draft", "sent", "partial"].includes(p.status),
  );
  const onPO = (id: string) => openPOs.find((p) => p.lines.some((l) => l.refId === id));
  const ordered = new Set(
    data.backlog.filter((b) => b.task === "Supplier order" && b.status !== "done").map((b) => b.itemId),
  );
  const suggest = (g: GroceryItem) => Math.max(g.reorderLevel * 3 - totalQty(g), g.reorderLevel);

  // admin -> goes on a draft PO, rep -> backlog request
  const order = (g: GroceryItem) =>
    update((d) => {
      if (!isAdmin) {
        d.backlog.unshift({
          id: uid(),
          itemId: g.id,
          task: "Supplier order",
          qty: suggest(g),
          createdOn: isoDate(today()),
          dueOn: isoDate(addDays(today(), 2)),
          status: "pending",
        });
        return;
      }
      let sup = d.suppliers.find((s) => s.name === g.supplier);
      if (!sup) {
        sup = {
          id: uid(),
          name: g.supplier,
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          gstin: "",
          sections: ["grocery"],
          paymentTermsDays: 30,
          notes: "",
        };
        d.suppliers.push(sup);
      }
      let po = d.purchaseOrders.find((p) => p.supplierId === sup!.id && p.status === "draft");
      if (!po) {
        const n = Math.max(3000, ...d.purchaseOrders.map((p) => Number(p.poNo.split("-")[1]) || 0)) + 1;
        po = {
          id: uid(),
          poNo: `PO-${n}`,
          supplierId: sup.id,
          section: "grocery",
          lines: [],
          createdOn: isoDate(today()),
          createdBy: user!.name,
          expectedOn: isoDate(addDays(today(), 5)),
          status: "draft",
          notes: "From To-order list",
        };
        d.purchaseOrders.unshift(po);
      }
      po.lines.push({ refId: g.id, name: g.name, qty: suggest(g), unitPrice: g.costPrice, receivedQty: 0 });
    });

  return (
    <div className="space-y-6">
      {isAdmin && openPOs.some((p) => p.status === "draft") && (
        <a
          href="/admin/purchase-orders"
          className="block rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
        >
          You have {openPOs.filter((p) => p.status === "draft").length} draft purchase order(s). Review and
          send them →
        </a>
      )}
      <Card title="Needs ordering" subtitle="Total stock is at or below the re-order level">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="th pl-0">Item</th>
                <th className="th">Supplier</th>
                <th className="th text-right">Stock available</th>
                <th className="th text-right">Re-order level</th>
                <th className="th text-right">Suggested qty</th>
                <th className="th text-right">Est. cost</th>
                <th className="th no-print" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {low.map((g) => (
                <tr key={g.id}>
                  <td className="td pl-0 font-medium text-slate-900">{g.name}</td>
                  <td className="td">{g.supplier}</td>
                  <td className="td text-right tabular-nums">
                    {totalQty(g) === 0 ? <Badge tone="danger">Out of stock</Badge> : totalQty(g)}
                  </td>
                  <td className="td text-right tabular-nums">{g.reorderLevel}</td>
                  <td className="td text-right font-medium tabular-nums">{suggest(g)}</td>
                  <td className="td text-right tabular-nums">{fmtMoney(suggest(g) * g.costPrice)}</td>
                  <td className="td no-print text-right">
                    {onPO(g.id) ? (
                      <Badge tone="info">
                        On {onPO(g.id)!.poNo} ({onPO(g.id)!.status})
                      </Badge>
                    ) : ordered.has(g.id) ? (
                      <Badge tone="info">Requested</Badge>
                    ) : (
                      <button className="btn-primary px-2.5 py-1 text-xs" onClick={() => order(g)}>
                        {isAdmin ? "Add to PO" : "Request order"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!low.length && (
                <tr>
                  <td className="td pl-0 text-slate-500" colSpan={7}>
                    Nothing to order right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="New items" subtitle="Added in the last 30 days">
        <ul className="divide-y divide-slate-100">
          {newItems.map((g) => (
            <li key={g.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{g.name}</span>
              <span className="text-slate-500">
                Added {fmtDate(g.addedOn)} · {totalQty(g)} in stock
              </span>
            </li>
          ))}
          {!newItems.length && <li className="py-3 text-sm text-slate-500">No new items this month.</li>}
        </ul>
      </Card>
    </div>
  );
}

const STATUS_TONE: Record<BacklogStatus, "warn" | "info" | "danger" | "good"> = {
  pending: "warn",
  "in-progress": "info",
  delayed: "danger",
  done: "good",
};

function Backlog() {
  const { data, update } = useStore();
  const [show, setShow] = useState<"open" | "all">("open");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    itemId: data.grocery[0]?.id ?? "",
    task: "Restock shelf",
    qty: 10,
    dueOn: isoDate(addDays(today(), 3)),
  });
  const itemName = (id: string) => data.grocery.find((g) => g.id === id)?.name ?? "—";
  const rows = data.backlog.filter((b) => show === "all" || b.status !== "done");

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-2">
        <select
          className="input w-auto"
          value={show}
          onChange={(e) => setShow(e.target.value as "open" | "all")}
        >
          <option value="open">Open tasks</option>
          <option value="all">All tasks</option>
        </select>
        <button className="btn-primary ml-auto" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add task
        </button>
      </div>
      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Task</th>
            <th className="th">Item</th>
            <th className="th text-right">Qty</th>
            <th className="th">Created</th>
            <th className="th">Due</th>
            <th className="th">Status</th>
          </tr>
        }
      >
        {rows.map((b) => {
          const overdue = b.status !== "done" && daysUntil(b.dueOn) < 0;
          return (
            <tr key={b.id} className="hover:bg-slate-50">
              <td className="td font-medium text-slate-900">{b.task}</td>
              <td className="td">{itemName(b.itemId)}</td>
              <td className="td text-right tabular-nums">{b.qty}</td>
              <td className="td">{fmtDate(b.createdOn)}</td>
              <td className="td">
                <span className={overdue ? "font-medium text-red-700" : ""}>{fmtDate(b.dueOn)}</span>
                {overdue && <span className="ml-2 text-xs text-red-600">overdue</span>}
              </td>
              <td className="td">
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                  <select
                    className="no-print rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs"
                    value={b.status}
                    onChange={(e) =>
                      update((d) => {
                        d.backlog.find((x) => x.id === b.id)!.status = e.target.value as BacklogStatus;
                      })
                    }
                  >
                    {(["pending", "in-progress", "delayed", "done"] as const).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add backlog task">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            update((d) => {
              d.backlog.unshift({ id: uid(), ...form, createdOn: isoDate(today()), status: "pending" });
            });
            setAdding(false);
          }}
        >
          <Field label="Item">
            <select
              className="input"
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            >
              {data.grocery.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Task">
            <select
              className="input"
              value={form.task}
              onChange={(e) => setForm({ ...form, task: e.target.value })}
            >
              {[
                "Restock shelf",
                "Supplier order",
                "Price label update",
                "Return to supplier",
                "Quality check",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input
                className="input"
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
              />
            </Field>
            <Field label="Due date">
              <input
                className="input"
                type="date"
                value={form.dueOn}
                onChange={(e) => setForm({ ...form, dueOn: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">Add task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Suspicious() {
  const { data, update } = useStore();
  const [show, setShow] = useState<"open" | "all">("open");
  const flagged = data.activity.filter((a) => a.suspicious && (show === "all" || !a.reviewed));
  const byUser = Object.entries(
    data.activity
      .filter((a) => a.suspicious)
      .reduce<Record<string, number>>((m, a) => ((m[a.userName] = (m[a.userName] ?? 0) + 1), m), {}),
  ).map(([user, count]) => ({ user, count }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <StatCard
            label="Needs review"
            value={data.activity.filter((a) => a.suspicious && !a.reviewed).length}
            tone="danger"
          />
          <Card title="What gets flagged">
            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
              <li>Negative adjustments of 25+ units</li>
              <li>Stock changes outside working hours (11 pm – 6 am)</li>
              <li>Unusually large write-offs or quantity changes</li>
            </ul>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card title="Flagged activity by user">
            <BarChartBox
              data={byUser}
              xKey="user"
              height={220}
              series={[{ key: "count", label: "Flags", color: "#e34948" }]}
            />
          </Card>
        </div>
      </div>

      <div className="no-print flex items-center gap-2">
        <select
          className="input w-auto"
          value={show}
          onChange={(e) => setShow(e.target.value as "open" | "all")}
        >
          <option value="open">Not reviewed</option>
          <option value="all">All flagged</option>
        </select>
      </div>
      <Table
        empty={!flagged.length}
        head={
          <tr>
            <th className="th">When</th>
            <th className="th">User</th>
            <th className="th">Action</th>
            <th className="th">Item</th>
            <th className="th text-right">Change</th>
            <th className="th">Why flagged</th>
            <th className="th no-print" />
          </tr>
        }
      >
        {flagged.map((a) => (
          <tr key={a.id} className="hover:bg-slate-50">
            <td className="td">{fmtDateTime(a.at)}</td>
            <td className="td font-medium text-slate-900">{a.userName}</td>
            <td className="td">{a.action}</td>
            <td className="td">{a.itemName}</td>
            <td className="td text-right tabular-nums">{a.delta}</td>
            <td className="td whitespace-normal text-red-700">{a.reason}</td>
            <td className="td no-print text-right">
              {a.reviewed ? (
                <Badge tone="good">
                  <CheckCircle2 size={12} /> Reviewed
                </Badge>
              ) : (
                <button
                  className="btn-ghost px-2.5 py-1 text-xs"
                  onClick={() =>
                    update((d) => {
                      d.activity.find((x) => x.id === a.id)!.reviewed = true;
                    })
                  }
                >
                  Mark reviewed
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
