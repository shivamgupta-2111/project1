"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { Toast } from "@/components/StockAction";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Download, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { BrightProduct } from "@/lib/types";
import { Badge, Card, Field, Modal, NoAccess, PageHeader, StatCard, Table } from "@/components/ui";
import { BarChartBox } from "@/components/charts";
import { SECTION_META, downloadCsv, fmtMoney, fmtNum, uid } from "@/lib/utils";

const COLOR = SECTION_META["bright-idea"].color;
const REGIONS = ["North", "South", "East", "West", "Central"];

export default function Page() {
  return (
    <Suspense>
      <BrightIdea />
    </Suspense>
  );
}

function BrightIdea() {
  const { data, user, update, logActivity, submit } = useStore();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clearResult = useCallback(() => setResult(null), []);
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [supplier, setSupplier] = useState("All");
  const [onlyLow, setOnlyLow] = useState(params.get("filter") === "low");
  const [editing, setEditing] = useState<BrightProduct | null>(null);
  const [adjust, setAdjust] = useState<BrightProduct | null>(null);

  const byRegion = useMemo(
    () =>
      REGIONS.map((r) => {
        const ps = data.bright.filter((b) => b.region === r);
        return {
          region: r,
          quantity: ps.reduce((s, b) => s + b.quantity, 0),
          low: ps.filter((b) => b.quantity < b.minQuantity).length,
        };
      }),
    [data.bright],
  );
  const bySupplier = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of data.bright)
      m.set(b.supplierName, (m.get(b.supplierName) ?? 0) + b.quantity * b.unitPrice);
    return [...m.entries()]
      .map(([supplier, value]) => ({ supplier, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.bright]);

  if (!user!.sections.includes("bright-idea")) return <NoAccess />;
  const isAdmin = user!.role === "admin";

  const suppliers = ["All", ...new Set(data.bright.map((b) => b.supplierName))];
  const low = data.bright.filter((b) => b.quantity < b.minQuantity);
  const rows = data.bright.filter(
    (b) =>
      (region === "All" || b.region === region) &&
      (supplier === "All" || b.supplierName === supplier) &&
      (!onlyLow || b.quantity < b.minQuantity) &&
      (b.productName + b.supplierName).toLowerCase().includes(q.toLowerCase()),
  );

  const save = (p: BrightProduct) => {
    const exists = data.bright.some((x) => x.id === p.id);
    update((d) => {
      if (exists) d.bright = d.bright.map((x) => (x.id === p.id ? p : x));
      else d.bright.unshift(p);
    });
    if (!exists)
      logActivity({
        section: "bright-idea",
        action: "New product added",
        itemName: p.productName,
        delta: p.quantity,
      });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bright Idea"
        subtitle={SECTION_META["bright-idea"].blurb}
        accent={COLOR}
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={() =>
                downloadCsv(
                  "bright-idea-products.csv",
                  rows.map((b) => ({
                    Product: b.productName,
                    Supplier: b.supplierName,
                    Region: b.region,
                    Quantity: b.quantity,
                    MinQuantity: b.minQuantity,
                    UnitPrice: b.unitPrice,
                  })),
                )
              }
            >
              <Download size={16} /> CSV
            </button>
            <button
              className="btn-primary"
              onClick={() =>
                setEditing({
                  id: uid(),
                  productName: "",
                  supplierName: "",
                  region: "North",
                  quantity: 0,
                  minQuantity: 20,
                  unitPrice: 0,
                  barcode: `891${Date.now().toString().slice(-10)}`,
                })
              }
            >
              <Plus size={16} /> Add product
            </button>
          </>
        }
      />

      {low.length > 0 && (
        <button
          onClick={() => setOnlyLow(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900"
        >
          <AlertTriangle size={18} />
          <span>
            <b>{low.length} products are low in quantity:</b>{" "}
            {low
              .slice(0, 4)
              .map((l) => l.productName)
              .join(", ")}
            {low.length > 4 && ` and ${low.length - 4} more`}
          </span>
          <span className="ml-auto whitespace-nowrap text-xs">Show only these →</span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={data.bright.length} />
        <StatCard label="Total units" value={fmtNum(data.bright.reduce((s, b) => s + b.quantity, 0))} />
        <StatCard
          label="Stock value"
          value={fmtMoney(data.bright.reduce((s, b) => s + b.quantity * b.unitPrice, 0))}
        />
        <StatCard
          label="Low quantity alerts"
          value={low.length}
          tone={low.length ? "warn" : "good"}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Units by region">
          <BarChartBox
            data={byRegion}
            xKey="region"
            height={240}
            series={[{ key: "quantity", label: "Units", color: COLOR }]}
          />
        </Card>
        <Card title="Stock value by supplier">
          <BarChartBox
            data={bySupplier}
            xKey="supplier"
            horizontal
            money
            height={240}
            series={[{ key: "value", label: "Value", color: "#2a78d6" }]}
          />
        </Card>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search product or supplier…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={region} onChange={(e) => setRegion(e.target.value)}>
          {["All", ...REGIONS].map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All regions" : r}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          {suppliers.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All suppliers" : s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Low quantity only
        </label>
      </div>

      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Product name</th>
            <th className="th">Supplier name</th>
            <th className="th">Region</th>
            <th className="th text-right">Quantity</th>
            <th className="th text-right">Alert below</th>
            <th className="th">Alert</th>
            <th className="th text-right">Unit price</th>
            <th className="th no-print" />
          </tr>
        }
      >
        {rows.map((b) => {
          const isLowQ = b.quantity < b.minQuantity;
          return (
            <tr key={b.id} className={isLowQ ? "bg-amber-50/40" : "hover:bg-slate-50"}>
              <td className="td font-medium text-slate-900">{b.productName}</td>
              <td className="td">{b.supplierName}</td>
              <td className="td">{b.region}</td>
              <td className="td text-right font-medium tabular-nums">{b.quantity}</td>
              <td className="td text-right tabular-nums">{b.minQuantity}</td>
              <td className="td">
                {b.quantity === 0 ? (
                  <Badge tone="danger">Out of stock</Badge>
                ) : isLowQ ? (
                  <Badge tone="warn">
                    <AlertTriangle size={12} /> Low
                  </Badge>
                ) : (
                  <Badge tone="good">OK</Badge>
                )}
              </td>
              <td className="td text-right tabular-nums">₹{fmtNum(b.unitPrice)}</td>
              <td className="td no-print">
                <div className="flex justify-end gap-1">
                  <button
                    title="Stock in / out"
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => setAdjust(b)}
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    title="Edit"
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => setEditing(b)}
                  >
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      title="Delete"
                      className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Delete ${b.productName}?`))
                          update((d) => {
                            d.bright = d.bright.filter((x) => x.id !== b.id);
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
        title={editing && data.bright.some((x) => x.id === editing.id) ? "Edit product" : "Add product"}
      >
        {editing && <ProductForm initial={editing} onSave={save} />}
      </Modal>

      {adjust && (
        <AdjustDialog
          product={adjust}
          onClose={() => setAdjust(null)}
          onSave={(delta) => {
            setResult(
              submit(
                delta > 0
                  ? { type: "bright-in", productId: adjust.id, qty: delta }
                  : { type: "bright-sell", productId: adjust.id, qty: -delta },
              ),
            );
            setAdjust(null);
          }}
        />
      )}
      <Toast result={result} onDone={clearResult} />
    </div>
  );
}

function ProductForm({ initial, onSave }: { initial: BrightProduct; onSave: (p: BrightProduct) => void }) {
  const [f, setF] = useState(initial);
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <div className="col-span-2">
        <Field label="Product name">
          <input
            className="input"
            required
            value={f.productName}
            onChange={(e) => setF({ ...f, productName: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Supplier name">
        <input
          className="input"
          required
          value={f.supplierName}
          onChange={(e) => setF({ ...f, supplierName: e.target.value })}
        />
      </Field>
      <Field label="Region">
        <select className="input" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })}>
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field label="Quantity">
        <input
          className="input"
          type="number"
          min={0}
          value={f.quantity}
          onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })}
        />
      </Field>
      <Field label="Alert when below">
        <input
          className="input"
          type="number"
          min={0}
          value={f.minQuantity}
          onChange={(e) => setF({ ...f, minQuantity: Number(e.target.value) })}
        />
      </Field>
      <Field label="Unit price (₹)">
        <input
          className="input"
          type="number"
          min={0}
          value={f.unitPrice}
          onChange={(e) => setF({ ...f, unitPrice: Number(e.target.value) })}
        />
      </Field>
      <Field label="Barcode">
        <input
          className="input"
          value={f.barcode}
          onChange={(e) => setF({ ...f, barcode: e.target.value })}
        />
      </Field>
      <div className="col-span-2 flex justify-end">
        <button className="btn-primary">Save product</button>
      </div>
    </form>
  );
}

function AdjustDialog({
  product,
  onClose,
  onSave,
}: {
  product: BrightProduct;
  onClose: () => void;
  onSave: (delta: number) => void;
}) {
  const [mode, setMode] = useState<"in" | "out">("in");
  const [qty, setQty] = useState(1);
  return (
    <Modal open onClose={onClose} title={`Stock in / out – ${product.productName}`}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(mode === "in" ? qty : -qty);
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          {(["in", "out"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={`btn ${mode === m ? "bg-ink-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
            >
              {m === "in" ? "Stock in" : "Sale / dispatch"}
            </button>
          ))}
        </div>
        <Field label="Quantity">
          <input
            className="input"
            type="number"
            min={1}
            max={mode === "out" ? product.quantity : undefined}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </Field>
        <p className="text-xs text-slate-500">
          Current: {product.quantity} · after: {Math.max(0, product.quantity + (mode === "in" ? qty : -qty))}{" "}
          · alert below {product.minQuantity}
        </p>
        <div className="flex justify-end">
          <button className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}
