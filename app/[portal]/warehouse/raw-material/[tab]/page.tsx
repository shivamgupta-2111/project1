"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Toast } from "@/components/StockAction";
import { Download, Plus, Truck } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  RAW_CATEGORIES,
  type RawCategory,
  type RawExport,
  type RawImport,
  type ShipmentStatus,
} from "@/lib/types";
import { Badge, Card, Field, Modal, NoAccess, PageHeader, StatCard, TabLinks, Table } from "@/components/ui";
import { BarChartBox, LineChartBox, ShareBar } from "@/components/charts";
import { rawByCategory, rawMonthly, rawStock } from "@/lib/analytics";
import {
  SECTION_META,
  SERIES,
  daysUntil,
  downloadCsv,
  fmtDate,
  fmtMoney,
  fmtNum,
  isoDate,
  rawExpiry,
  today,
  uid,
} from "@/lib/utils";

const COLOR = SECTION_META["raw-material"].color;
const CAT_COLOR: Record<RawCategory, string> = {
  Grain: SERIES[0],
  Pulse: SERIES[1],
  Vegetable: SERIES[2],
  Meat: SERIES[3],
};

export default function RawMaterialPage() {
  const { tab, portal } = useParams<{ tab: string; portal: string }>();
  const { data, user } = useStore();
  if (!user!.sections.includes("raw-material")) return <NoAccess />;
  const base = `/${portal}/warehouse/raw-material`;
  return (
    <div>
      <PageHeader
        title="Raw Material"
        subtitle="Unprocessed food — grain, pulse, vegetables and meat"
        accent={COLOR}
      />
      <TabLinks
        active={`${base}/${tab}`}
        tabs={[
          { href: `${base}/overview`, label: "Overview" },
          { href: `${base}/import`, label: "Import", count: data.imports.length },
          { href: `${base}/export`, label: "Export", count: data.exports.length },
        ]}
      />
      {tab === "overview" ? (
        <Overview />
      ) : tab === "import" ? (
        <Imports />
      ) : tab === "export" ? (
        <Exports />
      ) : (
        <NoAccess />
      )}
    </div>
  );
}

function CategoryChips({
  value,
  onChange,
}: {
  value: RawCategory | "All";
  onChange: (v: RawCategory | "All") => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(["All", ...RAW_CATEGORIES] as const).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
            value === c
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {c !== "All" && <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLOR[c] }} />}
          {c === "Vegetable" ? "Vegetables" : c === "Pulse" ? "Pulses" : c === "Grain" ? "Grains" : c}
        </button>
      ))}
    </div>
  );
}

function Overview() {
  const { data } = useStore();
  const stock = useMemo(() => rawStock(data), [data]);
  const monthly = useMemo(() => rawMonthly(data, 6), [data]);
  const cats = useMemo(() => rawByCategory(data), [data]);
  const ym = isoDate(today()).slice(0, 7);
  const impM = data.imports.filter((i) => i.arrivalDate.startsWith(ym)).reduce((s, i) => s + i.quantity, 0);
  const expM = data.exports.filter((i) => i.exportDate.startsWith(ym)).reduce((s, i) => s + i.quantity, 0);
  const expiring = data.imports.filter((i) => {
    const d = daysUntil(rawExpiry(i));
    return d >= 0 && d <= 14;
  });
  const balanceByCat = RAW_CATEGORIES.map((c) => ({
    label: c,
    value: stock.filter((s) => s.category === c).reduce((a, s) => a + Math.max(0, s.balance), 0),
    color: CAT_COLOR[c],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="In stock"
          value={`${fmtNum(stock.reduce((s, r) => s + Math.max(0, r.balance), 0))} kg`}
        />
        <StatCard label="Imported this month" value={`${fmtNum(impM)} kg`} />
        <StatCard label="Exported this month" value={`${fmtNum(expM)} kg`} />
        <StatCard
          label="Lots expiring in 14 days"
          value={expiring.length}
          tone={expiring.length ? "warn" : "good"}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Imports vs exports" subtitle="kg per month, last 6 months">
            <LineChartBox
              data={monthly}
              xKey="month"
              series={[
                { key: "imported", label: "Imported (kg)", color: "#2a78d6" },
                { key: "exported", label: "Exported (kg)", color: "#eb6834" },
              ]}
            />
          </Card>
        </div>
        <Card title="Stock on hand by category">
          <ShareBar parts={balanceByCat.map((b) => ({ ...b, display: `${fmtNum(b.value)} kg` }))} />
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Totals by category" subtitle="All-time kg">
          <BarChartBox
            data={cats}
            xKey="category"
            series={[
              { key: "imported", label: "Imported", color: "#2a78d6" },
              { key: "exported", label: "Exported", color: "#eb6834" },
            ]}
          />
        </Card>
        <Card title="Stock balance by product" subtitle="Imported − exported (kg)">
          <div className="max-h-[280px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="th pl-0">Product</th>
                  <th className="th text-right">In</th>
                  <th className="th text-right">Out</th>
                  <th className="th text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((s) => (
                  <tr key={s.product}>
                    <td className="td pl-0">
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ background: CAT_COLOR[s.category] }}
                      />
                      {s.product}
                    </td>
                    <td className="td text-right tabular-nums">{fmtNum(s.imported)}</td>
                    <td className="td text-right tabular-nums">{fmtNum(s.exported)}</td>
                    <td
                      className={`td text-right font-medium tabular-nums ${s.balance < 0 ? "text-red-700" : ""}`}
                    >
                      {fmtNum(s.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Imports() {
  const { data, update, logActivity } = useStore();
  const [cat, setCat] = useState<RawCategory | "All">("All");
  const [adding, setAdding] = useState(false);
  const rows = data.imports.filter((i) => cat === "All" || i.category === cat);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-3">
        <CategoryChips value={cat} onChange={setCat} />
        <div className="ml-auto flex gap-2">
          <button
            className="btn-ghost"
            onClick={() =>
              downloadCsv(
                "raw-imports.csv",
                rows.map((i) => ({
                  Product: i.product,
                  Category: i.category,
                  Supplier: i.supplier,
                  Origin: i.origin,
                  Arrival: i.arrivalDate,
                  ShelfLifeDays: i.shelfLifeDays,
                  Expires: rawExpiry(i),
                  QuantityKg: i.quantity,
                  CostPerKg: i.costPerKg,
                })),
              )
            }
          >
            <Download size={16} /> CSV
          </button>
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Record import
          </button>
        </div>
      </div>
      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Product</th>
            <th className="th">Supplier / origin</th>
            <th className="th">Day of arrival</th>
            <th className="th">Shelf life</th>
            <th className="th">Expires</th>
            <th className="th text-right">Quantity</th>
            <th className="th text-right">Value</th>
          </tr>
        }
      >
        {rows.map((i) => {
          const exp = rawExpiry(i);
          const d = daysUntil(exp);
          return (
            <tr key={i.id} className="hover:bg-slate-50">
              <td className="td">
                <p className="font-medium text-slate-900">{i.product}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLOR[i.category] }} />
                  {i.category}
                </p>
              </td>
              <td className="td">
                <p>{i.supplier}</p>
                <p className="text-xs text-slate-500">{i.origin}</p>
              </td>
              <td className="td">{fmtDate(i.arrivalDate)}</td>
              <td className="td">{i.shelfLifeDays} days</td>
              <td className="td">
                <div className="flex items-center gap-2">
                  {fmtDate(exp)}
                  {d < 0 ? (
                    <Badge tone="danger">Expired</Badge>
                  ) : d <= 14 ? (
                    <Badge tone="warn">{d}d left</Badge>
                  ) : null}
                </div>
              </td>
              <td className="td text-right font-medium tabular-nums">{fmtNum(i.quantity)} kg</td>
              <td className="td text-right tabular-nums">{fmtMoney(i.quantity * i.costPerKg)}</td>
            </tr>
          );
        })}
      </Table>
      <Modal open={adding} onClose={() => setAdding(false)} title="Record import (arrival)">
        <ImportForm
          onSave={(im) => {
            update((d) => {
              d.imports.unshift(im);
              d.imports.sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));
              d.transactions.unshift({
                id: uid(),
                date: im.arrivalDate,
                type: "buying",
                section: "raw-material",
                description: `Import: ${im.product} ${im.quantity} kg`,
                party: im.supplier,
                amount: im.quantity * im.costPerKg,
                paid: false,
                archived: false,
              });
            });
            logActivity({
              section: "raw-material",
              action: "Import arrived",
              itemName: im.product,
              delta: im.quantity,
            });
            setAdding(false);
          }}
        />
      </Modal>
    </div>
  );
}

function ImportForm({ onSave }: { onSave: (i: RawImport) => void }) {
  const [f, setF] = useState<RawImport>({
    id: uid(),
    product: "",
    category: "Grain",
    supplier: "",
    origin: "",
    arrivalDate: isoDate(today()),
    shelfLifeDays: 180,
    quantity: 100,
    costPerKg: 0,
  });
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <Field label="Product">
        <input
          className="input"
          required
          list="rawprods"
          value={f.product}
          onChange={(e) => setF({ ...f, product: e.target.value })}
        />
      </Field>
      <Field label="Category">
        <select
          className="input"
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value as RawCategory })}
        >
          {RAW_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Supplier">
        <input
          className="input"
          required
          value={f.supplier}
          onChange={(e) => setF({ ...f, supplier: e.target.value })}
        />
      </Field>
      <Field label="Origin">
        <input className="input" value={f.origin} onChange={(e) => setF({ ...f, origin: e.target.value })} />
      </Field>
      <Field label="Day of arrival">
        <input
          className="input"
          type="date"
          value={f.arrivalDate}
          onChange={(e) => setF({ ...f, arrivalDate: e.target.value })}
        />
      </Field>
      <Field label="Shelf life (days)">
        <input
          className="input"
          type="number"
          min={1}
          value={f.shelfLifeDays}
          onChange={(e) => setF({ ...f, shelfLifeDays: Number(e.target.value) })}
        />
      </Field>
      <Field label="Quantity (kg)">
        <input
          className="input"
          type="number"
          min={1}
          value={f.quantity}
          onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })}
        />
      </Field>
      <Field label="Cost per kg (₹)">
        <input
          className="input"
          type="number"
          min={0}
          value={f.costPerKg}
          onChange={(e) => setF({ ...f, costPerKg: Number(e.target.value) })}
        />
      </Field>
      <p className="col-span-2 text-xs text-slate-500">Expires on {fmtDate(rawExpiry(f))}</p>
      <datalist id="rawprods">
        {[
          "Wheat",
          "Paddy Rice",
          "Maize",
          "Chana",
          "Moong",
          "Masoor",
          "Onion",
          "Potato",
          "Tomato",
          "Chicken",
          "Mutton",
          "Fish (Rohu)",
        ].map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <div className="col-span-2 flex justify-end">
        <button className="btn-primary">Save import</button>
      </div>
    </form>
  );
}

const SHIP_TONE: Record<ShipmentStatus, "warn" | "info" | "good"> = {
  preparing: "warn",
  shipped: "info",
  delivered: "good",
};

function Exports() {
  const { data, update, submit } = useStore();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clearResult = useCallback(() => setResult(null), []);
  const [cat, setCat] = useState<RawCategory | "All">("All");
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<RawExport | null>(null);
  const rows = data.exports.filter((x) => cat === "All" || x.category === cat);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-3">
        <CategoryChips value={cat} onChange={setCat} />
        <div className="ml-auto flex gap-2">
          <button
            className="btn-ghost"
            onClick={() =>
              downloadCsv(
                "raw-exports.csv",
                rows.map((x) => ({
                  Shipment: x.shipmentNo,
                  Product: x.product,
                  Category: x.category,
                  QuantityKg: x.quantity,
                  Buyer: x.buyer,
                  Destination: x.destination,
                  Carrier: x.carrier,
                  Vehicle: x.vehicleNo,
                  ExportDate: x.exportDate,
                  PricePerKg: x.pricePerKg,
                  Status: x.status,
                })),
              )
            }
          >
            <Download size={16} /> CSV
          </button>
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> New shipment
          </button>
        </div>
      </div>
      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Shipment</th>
            <th className="th">Product</th>
            <th className="th">Buyer / destination</th>
            <th className="th">Day of export</th>
            <th className="th text-right">Quantity</th>
            <th className="th text-right">Value</th>
            <th className="th">Status</th>
          </tr>
        }
      >
        {rows.map((x) => (
          <tr key={x.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setView(x)}>
            <td className="td font-medium text-slate-900">{x.shipmentNo}</td>
            <td className="td">
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ background: CAT_COLOR[x.category] }}
              />
              {x.product}
            </td>
            <td className="td">
              <p>{x.buyer}</p>
              <p className="text-xs text-slate-500">{x.destination}</p>
            </td>
            <td className="td">{fmtDate(x.exportDate)}</td>
            <td className="td text-right tabular-nums">{fmtNum(x.quantity)} kg</td>
            <td className="td text-right tabular-nums">{fmtMoney(x.quantity * x.pricePerKg)}</td>
            <td className="td" onClick={(e) => e.stopPropagation()}>
              <select
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs"
                value={x.status}
                onChange={(e) =>
                  update((d) => {
                    d.exports.find((y) => y.id === x.id)!.status = e.target.value as ShipmentStatus;
                  })
                }
              >
                {(["preparing", "shipped", "delivered"] as const).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!view} onClose={() => setView(null)} title={`Shipment ${view?.shipmentNo ?? ""}`}>
        {view && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              ["Product", `${view.product} (${view.category})`],
              ["Quantity", `${fmtNum(view.quantity)} kg`],
              ["Buyer", view.buyer],
              ["Destination", view.destination],
              ["Carrier", view.carrier],
              ["Vehicle no.", view.vehicleNo],
              ["Day of export", fmtDate(view.exportDate)],
              ["Price per kg", `₹${view.pricePerKg}`],
              ["Shipment value", fmtMoney(view.quantity * view.pricePerKg)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd>
                <Badge tone={SHIP_TONE[view.status]}>
                  <Truck size={12} /> {view.status}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="New export shipment">
        <ExportForm
          onSave={(x) => {
            setResult(submit({ type: "raw-export", shipment: x }));
            setAdding(false);
          }}
        />
      </Modal>
      <Toast result={result} onDone={clearResult} />
    </div>
  );
}

function ExportForm({ onSave }: { onSave: (x: RawExport) => void }) {
  const { data } = useStore();
  const stock = useMemo(() => rawStock(data).filter((s) => s.balance > 0), [data]);
  const [f, setF] = useState<RawExport>({
    id: uid(),
    shipmentNo: `SHP-${24100 + data.exports.length + 1}`,
    product: stock[0]?.product ?? "",
    category: stock[0]?.category ?? "Grain",
    quantity: 100,
    destination: "",
    buyer: "",
    carrier: "",
    vehicleNo: "",
    exportDate: isoDate(today()),
    pricePerKg: 0,
    status: "preparing",
  });
  const available = stock.find((s) => s.product === f.product)?.balance ?? 0;
  const over = f.quantity > available;

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!over) onSave(f);
      }}
    >
      <Field label="Shipment no.">
        <input
          className="input"
          value={f.shipmentNo}
          onChange={(e) => setF({ ...f, shipmentNo: e.target.value })}
        />
      </Field>
      <Field label="Product (in stock)">
        <select
          className="input"
          value={f.product}
          onChange={(e) => {
            const s = stock.find((x) => x.product === e.target.value)!;
            setF({ ...f, product: s.product, category: s.category });
          }}
        >
          {stock.map((s) => (
            <option key={s.product} value={s.product}>
              {s.product} ({fmtNum(s.balance)} kg)
            </option>
          ))}
        </select>
      </Field>
      <Field label="Quantity (kg)">
        <input
          className={`input ${over ? "border-red-400" : ""}`}
          type="number"
          min={1}
          value={f.quantity}
          onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })}
        />
      </Field>
      <Field label="Price per kg (₹)">
        <input
          className="input"
          type="number"
          min={0}
          value={f.pricePerKg}
          onChange={(e) => setF({ ...f, pricePerKg: Number(e.target.value) })}
        />
      </Field>
      {over && (
        <p className="col-span-2 text-xs text-red-600">
          Only {fmtNum(available)} kg of {f.product} in stock.
        </p>
      )}
      <Field label="Buyer">
        <input
          className="input"
          required
          value={f.buyer}
          onChange={(e) => setF({ ...f, buyer: e.target.value })}
        />
      </Field>
      <Field label="Destination">
        <input
          className="input"
          required
          value={f.destination}
          onChange={(e) => setF({ ...f, destination: e.target.value })}
        />
      </Field>
      <Field label="Carrier">
        <input
          className="input"
          value={f.carrier}
          onChange={(e) => setF({ ...f, carrier: e.target.value })}
        />
      </Field>
      <Field label="Vehicle no.">
        <input
          className="input"
          value={f.vehicleNo}
          onChange={(e) => setF({ ...f, vehicleNo: e.target.value })}
        />
      </Field>
      <Field label="Day of export">
        <input
          className="input"
          type="date"
          value={f.exportDate}
          onChange={(e) => setF({ ...f, exportDate: e.target.value })}
        />
      </Field>
      <Field label="Status">
        <select
          className="input"
          value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value as ShipmentStatus })}
        >
          {(["preparing", "shipped", "delivered"] as const).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <div className="col-span-2 flex justify-end">
        <button className="btn-primary" disabled={over || !stock.length}>
          Save shipment
        </button>
      </div>
    </form>
  );
}
