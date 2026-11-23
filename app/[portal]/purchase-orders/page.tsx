"use client";

import Link from "next/link";
import { useState } from "react";
import { PackageCheck, Plus, Send, Trash2, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import type { POLine, POStatus, PurchaseOrder } from "@/lib/types";
import { Field, Modal, NoAccess, PageHeader, StatCard, TabButtons, Table } from "@/components/ui";
import { POStatusBadge, ReceivePOModal, Stars } from "@/components/PurchaseOrderParts";
import { poOverdue, poValue } from "@/lib/perf";
import { SECTION_META, addDays, fmtDate, fmtMoney, isLow, isoDate, today, totalQty, uid } from "@/lib/utils";

type Filter = "open" | POStatus | "all";

export default function PurchaseOrders() {
  const { data, user, update } = useStore();
  const [filter, setFilter] = useState<Filter>("open");
  const [creating, setCreating] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  if (user!.role !== "admin") return <NoAccess />;

  const supName = (id: string) => data.suppliers.find((s) => s.id === id)?.name ?? "—";
  const open = data.purchaseOrders.filter((p) => p.status === "sent" || p.status === "partial");
  const ym = isoDate(today()).slice(0, 7);
  const rows = data.purchaseOrders.filter((p) =>
    filter === "all"
      ? true
      : filter === "open"
        ? p.status === "sent" || p.status === "partial" || p.status === "draft"
        : p.status === filter,
  );
  const view = data.purchaseOrders.find((p) => p.id === viewId) ?? null;

  const setStatus = (id: string, status: POStatus) =>
    update((d) => {
      d.purchaseOrders.find((p) => p.id === id)!.status = status;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase orders"
        subtitle="Order from suppliers, track deliveries, and stock is added automatically when goods arrive."
        actions={
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> New PO
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open POs" value={open.length} hint="Sent or partly received" />
        <StatCard label="Value on order" value={fmtMoney(open.reduce((s, p) => s + poValue(p), 0))} />
        <StatCard
          label="Overdue deliveries"
          value={open.filter(poOverdue).length}
          tone={open.some(poOverdue) ? "danger" : "good"}
        />
        <StatCard
          label="Received this month"
          value={data.purchaseOrders.filter((p) => p.receivedOn?.startsWith(ym)).length}
        />
      </div>

      <TabButtons
        active={filter}
        onChange={setFilter}
        tabs={[
          { id: "open", label: "Open" },
          { id: "draft", label: "Draft" },
          { id: "sent", label: "Sent" },
          { id: "partial", label: "Partial" },
          { id: "received", label: "Received" },
          { id: "cancelled", label: "Cancelled" },
          { id: "all", label: "All" },
        ]}
      />

      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">PO</th>
            <th className="th">Supplier</th>
            <th className="th">Section</th>
            <th className="th">Created</th>
            <th className="th">Expected</th>
            <th className="th text-right">Value</th>
            <th className="th">Status</th>
            <th className="th no-print" />
          </tr>
        }
      >
        {rows.map((p) => (
          <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setViewId(p.id)}>
            <td className="td font-medium text-slate-900">{p.poNo}</td>
            <td className="td">
              <Link
                href={`/admin/suppliers/${p.supplierId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                {supName(p.supplierId)}
              </Link>
            </td>
            <td className="td">{SECTION_META[p.section].label}</td>
            <td className="td">{fmtDate(p.createdOn)}</td>
            <td className="td">{fmtDate(p.expectedOn)}</td>
            <td className="td text-right tabular-nums">{fmtMoney(poValue(p))}</td>
            <td className="td">
              <POStatusBadge po={p} />
            </td>
            <td className="td no-print text-right" onClick={(e) => e.stopPropagation()}>
              {p.status === "draft" && (
                <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setStatus(p.id, "sent")}>
                  <Send size={14} /> Send
                </button>
              )}
              {(p.status === "sent" || p.status === "partial") && (
                <button className="btn-primary px-2.5 py-1 text-xs" onClick={() => setReceiving(p)}>
                  <PackageCheck size={14} /> Receive
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      {creating && <CreatePO onClose={() => setCreating(false)} />}
      {receiving && <ReceivePOModal po={receiving} onClose={() => setReceiving(null)} />}

      <Modal
        open={!!view}
        onClose={() => setViewId(null)}
        title={view ? `${view.poNo} · ${supName(view.supplierId)}` : ""}
      >
        {view && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <POStatusBadge po={view} />
              <span>
                Created {fmtDate(view.createdOn)} by {view.createdBy}
              </span>
              <span>· Expected {fmtDate(view.expectedOn)}</span>
              {view.receivedOn && <span>· Received {fmtDate(view.receivedOn)}</span>}
            </div>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {view.lines.map((l, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {l.receivedQty}/{l.qty}
                  </span>
                  <span className="w-20 text-right tabular-nums">₹{l.unitPrice}</span>
                  <span className="w-24 text-right font-medium tabular-nums">
                    {fmtMoney(l.qty * l.unitPrice)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{fmtMoney(poValue(view))}</span>
              </div>
            </div>
            {view.rating && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                Delivery rating <Stars value={view.rating} />
              </p>
            )}
            {view.notes && <p className="text-sm text-slate-600">Notes: {view.notes}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              {(view.status === "draft" || view.status === "sent") && (
                <button
                  className="btn-ghost text-red-600"
                  onClick={() => {
                    if (confirm(`Cancel ${view.poNo}?`)) setStatus(view.id, "cancelled");
                  }}
                >
                  <XCircle size={16} /> Cancel PO
                </button>
              )}
              {view.status === "draft" && (
                <button className="btn-primary" onClick={() => setStatus(view.id, "sent")}>
                  <Send size={16} /> Mark as sent
                </button>
              )}
              {(view.status === "sent" || view.status === "partial") && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setReceiving(view);
                    setViewId(null);
                  }}
                >
                  <PackageCheck size={16} /> Receive goods
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CreatePO({ onClose }: { onClose: () => void }) {
  const { data, user, update } = useStore();
  const supplierOptions = data.suppliers.filter(
    (s) => s.sections.includes("grocery") || s.sections.includes("bright-idea"),
  );
  const [supplierId, setSupplierId] = useState(supplierOptions[0]?.id ?? "");
  const [expectedOn, setExpectedOn] = useState(isoDate(addDays(today(), 5)));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<POLine[]>([]);
  const sup = data.suppliers.find((s) => s.id === supplierId);
  const section: "grocery" | "bright-idea" = sup?.sections.includes("bright-idea")
    ? "bright-idea"
    : "grocery";

  const catalog =
    section === "grocery"
      ? data.grocery.map((g) => ({
          refId: g.id,
          name: g.name,
          price: g.costPrice,
          low: isLow(g),
          stock: totalQty(g),
          ofSupplier: g.supplier === sup?.name,
          suggest: Math.max(g.reorderLevel * 3 - totalQty(g), g.reorderLevel),
        }))
      : data.bright.map((b) => ({
          refId: b.id,
          name: b.productName,
          price: b.unitPrice,
          low: b.quantity < b.minQuantity,
          stock: b.quantity,
          ofSupplier: b.supplierName === sup?.name,
          suggest: Math.max(b.minQuantity * 3 - b.quantity, b.minQuantity),
        }));

  const lastPrice = (refId: string) => {
    const prev = data.purchaseOrders
      .filter((p) => p.supplierId === supplierId && p.status !== "cancelled")
      .sort((a, b) => b.createdOn.localeCompare(a.createdOn))
      .flatMap((p) => p.lines)
      .find((l) => l.refId === refId);
    return prev?.unitPrice;
  };

  const addLine = (refId: string, qty?: number) => {
    const c = catalog.find((x) => x.refId === refId);
    if (!c || lines.some((l) => l.refId === refId)) return;
    setLines((ls) => [
      ...ls,
      { refId, name: c.name, qty: qty ?? c.suggest, unitPrice: lastPrice(refId) ?? c.price, receivedQty: 0 },
    ]);
  };
  const lowForSupplier = catalog.filter(
    (c) => c.low && c.ofSupplier && !lines.some((l) => l.refId === c.refId),
  );
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const save = (status: "draft" | "sent") => {
    if (!lines.length) return;
    update((d) => {
      const n = Math.max(3000, ...d.purchaseOrders.map((p) => Number(p.poNo.split("-")[1]) || 0)) + 1;
      d.purchaseOrders.unshift({
        id: uid(),
        poNo: `PO-${n}`,
        supplierId,
        section,
        lines,
        createdOn: isoDate(today()),
        createdBy: user!.name,
        expectedOn,
        status,
        notes,
      });
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New purchase order">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Supplier">
            <select
              className="input"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setLines([]);
              }}
            >
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.sections.map((x) => SECTION_META[x].label).join(", ")})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expected delivery">
            <input
              className="input"
              type="date"
              value={expectedOn}
              onChange={(e) => setExpectedOn(e.target.value)}
            />
          </Field>
        </div>

        {lowForSupplier.length > 0 && (
          <button
            type="button"
            className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900"
            onClick={() => lowForSupplier.forEach((c) => addLine(c.refId))}
          >
            + Add {lowForSupplier.length} low-stock items usually bought from {sup?.name}
          </button>
        )}

        <Field label="Add item">
          <select className="input" value="" onChange={(e) => addLine(e.target.value)}>
            <option value="">Choose an item…</option>
            {catalog
              .filter((c) => !lines.some((l) => l.refId === c.refId))
              .map((c) => (
                <option key={c.refId} value={c.refId}>
                  {c.name} — stock {c.stock}
                  {c.low ? " (LOW)" : ""}
                </option>
              ))}
          </select>
        </Field>

        {lines.length > 0 && (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {lines.map((l, i) => (
              <div key={l.refId} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
                <input
                  type="number"
                  min={1}
                  className="input w-20 text-right"
                  value={l.qty}
                  onChange={(e) =>
                    setLines(lines.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))
                  }
                  title="Quantity"
                />
                <input
                  type="number"
                  min={0}
                  className="input w-24 text-right"
                  value={l.unitPrice}
                  onChange={(e) =>
                    setLines(lines.map((x, j) => (j === i ? { ...x, unitPrice: Number(e.target.value) } : x)))
                  }
                  title="Unit price"
                />
                <button
                  className="rounded p-1 text-slate-400 hover:text-red-600"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{fmtMoney(total)}</span>
            </div>
          </div>
        )}

        <Field label="Notes">
          <input
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" disabled={!lines.length} onClick={() => save("draft")}>
            Save draft
          </button>
          <button className="btn-primary" disabled={!lines.length} onClick={() => save("sent")}>
            <Send size={16} /> Save & send
          </button>
        </div>
      </div>
    </Modal>
  );
}
