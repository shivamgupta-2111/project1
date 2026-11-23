"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Minus, Plus, Search, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ErpAction, ErpData, Section } from "@/lib/types";
import { Badge } from "@/components/ui";
import { SECTION_META, daysUntil, fmtDate, totalQty } from "@/lib/utils";

export type ItemRef = { kind: "grocery" | "bright"; id: string };

export interface ItemInfo {
  ref: ItemRef;
  name: string;
  code: string;
  sku?: string;
  section: Section;
  stock: number;
  shelf?: number;
  store?: number;
  price: number;
  low: boolean;
  expiry?: string;
  extra: string;
}

export function itemInfo(d: ErpData, ref: ItemRef): ItemInfo | null {
  if (ref.kind === "grocery") {
    const g = d.grocery.find((x) => x.id === ref.id);
    if (!g) return null;
    return {
      ref,
      name: g.name,
      code: g.barcode,
      sku: g.sku,
      section: "grocery",
      stock: totalQty(g),
      shelf: g.shelfQty,
      store: g.storeQty,
      price: g.sellPrice,
      low: totalQty(g) <= g.reorderLevel,
      expiry: g.expiryDate,
      extra: `${g.category} · ${g.supplier}`,
    };
  }
  const b = d.bright.find((x) => x.id === ref.id);
  if (!b) return null;
  return {
    ref,
    name: b.productName,
    code: b.barcode,
    section: "bright-idea",
    stock: b.quantity,
    price: b.unitPrice,
    low: b.quantity < b.minQuantity,
    extra: `${b.supplierName} · ${b.region} region`,
  };
}

export function findByCode(d: ErpData, code: string, sections: Section[]): ItemRef | null {
  const c = code.trim().toLowerCase();
  if (sections.includes("grocery")) {
    const g = d.grocery.find((x) => x.barcode.toLowerCase() === c || x.sku.toLowerCase() === c);
    if (g) return { kind: "grocery", id: g.id };
  }
  if (sections.includes("bright-idea")) {
    const b = d.bright.find((x) => x.barcode.toLowerCase() === c);
    if (b) return { kind: "bright", id: b.id };
  }
  return null;
}

export function ItemPicker({ onPick }: { onPick: (r: ItemRef) => void }) {
  const { data, user } = useStore();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = user!.sections;
    const out: ItemInfo[] = [];
    if (s.includes("grocery"))
      data.grocery.forEach((g) => out.push(itemInfo(data, { kind: "grocery", id: g.id })!));
    if (s.includes("bright-idea"))
      data.bright.forEach((b) => out.push(itemInfo(data, { kind: "bright", id: b.id })!));
    const t = q.toLowerCase();
    return out
      .filter((i) => (i.name + i.code + (i.sku ?? "")).toLowerCase().includes(t))
      .slice(0, q ? 30 : 8);
  }, [data, user, q]);

  return (
    <div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input py-3 pl-9 text-base"
          placeholder="Search item name, SKU or barcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {list.map((i) => (
          <li key={i.ref.id}>
            <button
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50"
              onClick={() => onPick(i.ref)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: SECTION_META[i.section].color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{i.name}</span>
                <span className="block text-xs text-slate-500">{i.sku ?? i.code}</span>
              </span>
              <span
                className={`text-sm tabular-nums ${i.low ? "font-medium text-amber-700" : "text-slate-600"}`}
              >
                {i.stock}
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="px-3 py-4 text-sm text-slate-500">No matching items.</li>}
      </ul>
    </div>
  );
}

export function ItemCard({ info }: { info: ItemInfo }) {
  const d = info.expiry ? daysUntil(info.expiry) : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
          style={{ background: SECTION_META[info.section].color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{info.name}</p>
          <p className="text-xs text-slate-500">
            {SECTION_META[info.section].label} · {info.extra}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{info.code}</p>
        </div>
        {info.low && <Badge tone="warn">Low</Badge>}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {info.shelf !== undefined ? (
          <>
            <Stat k="On shelf" v={info.shelf} />
            <Stat k="Store room" v={info.store!} />
          </>
        ) : (
          <Stat k="In stock" v={info.stock} />
        )}
        <Stat k="Price" v={`₹${info.price}`} />
        {d !== null && info.shelf === undefined && <Stat k="Expiry" v={fmtDate(info.expiry!)} />}
      </dl>
      {d !== null && (
        <p
          className={`mt-2 text-center text-xs ${d < 0 ? "text-red-700" : d <= 15 ? "text-amber-700" : "text-slate-500"}`}
        >
          {d < 0 ? `Expired ${-d} days ago` : `Expires ${fmtDate(info.expiry!)} (${d} days)`}
        </p>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <dt className="text-[11px] text-slate-500">{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  );
}

type Mode = "in" | "sale" | "out" | "shelf";
const OUT_REASONS = ["Damaged", "Expired", "Count correction", "Returned to supplier", "Other"];

export function Toast({
  result,
  onDone,
}: {
  result: { status: string; message: string } | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [result, onDone]);
  if (!result) return null;
  const cfg =
    result.status === "applied"
      ? { cls: "bg-emerald-600", Icon: CheckCircle2 }
      : result.status === "pending"
        ? { cls: "bg-amber-500", Icon: Clock }
        : { cls: "bg-red-600", Icon: XCircle };
  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 lg:bottom-6">
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${cfg.cls}`}
      >
        <cfg.Icon size={18} /> {result.message}
      </div>
    </div>
  );
}

export function StockActionForm({
  info,
  initialMode = "sale",
  onDone,
}: {
  info: ItemInfo;
  initialMode?: Mode;
  onDone?: (r: { status: "applied" | "pending" | "error"; message: string }) => void;
}) {
  const { submit, data, user } = useStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(OUT_REASONS[0]);
  const isGrocery = info.ref.kind === "grocery";
  const modes: { id: Mode; label: string }[] = [
    { id: "in", label: "Stock in" },
    { id: "sale", label: "Sale" },
    { id: "out", label: "Stock out" },
    ...(isGrocery ? [{ id: "shelf" as Mode, label: "To shelf" }] : []),
  ];
  const max = mode === "shelf" ? (info.store ?? 0) : mode === "in" ? undefined : info.stock;

  const build = (): ErpAction => {
    if (isGrocery) {
      if (mode === "in") return { type: "grocery-receive", itemId: info.ref.id, qty };
      if (mode === "sale") return { type: "grocery-sell", itemId: info.ref.id, qty };
      if (mode === "shelf") return { type: "grocery-move", itemId: info.ref.id, qty };
      if (reason === "Damaged" || reason === "Expired")
        return { type: "grocery-writeoff", itemId: info.ref.id, qty, reason };
      return { type: "grocery-adjust", itemId: info.ref.id, delta: -qty, reason, where: "storeQty" };
    }
    if (mode === "in") return { type: "bright-in", productId: info.ref.id, qty };
    if (mode === "sale") return { type: "bright-sell", productId: info.ref.id, qty };
    return { type: "bright-adjust", productId: info.ref.id, delta: -qty, reason };
  };

  const willNeedApproval = (() => {
    if (user!.role === "admin" || mode !== "out") return false;
    const s = data.settings;
    if ((reason === "Damaged" || reason === "Expired") && s.approveWriteOffs) return true;
    return qty >= s.approvalThreshold;
  })();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (qty < 1) return;
        const r = submit(build());
        onDone?.(r);
        if (r.status !== "error") setQty(1);
      }}
    >
      <div className={`grid gap-1 rounded-xl bg-slate-100 p-1 ${isGrocery ? "grid-cols-4" : "grid-cols-3"}`}>
        {modes.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-lg py-2.5 text-sm font-medium transition ${mode === m.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <span className="label">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost h-12 w-12 p-0"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Less"
          >
            <Minus size={18} />
          </button>
          <input
            className="input h-12 flex-1 text-center text-lg font-semibold tabular-nums"
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={qty}
            onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
          />
          <button
            type="button"
            className="btn-ghost h-12 w-12 p-0"
            onClick={() => setQty((q) => (max !== undefined ? Math.min(max, q + 1) : q + 1))}
            aria-label="More"
          >
            <Plus size={18} />
          </button>
        </div>
        {max !== undefined && <p className="mt-1 text-xs text-slate-500">Available: {max}</p>}
        {mode === "sale" && (
          <p className="mt-1 text-xs text-slate-500">Amount: ₹{(qty * info.price).toLocaleString("en-IN")}</p>
        )}
      </div>

      {mode === "out" && (
        <div>
          <span className="label">Reason</span>
          <div className="flex flex-wrap gap-1.5">
            {OUT_REASONS.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setReason(r)}
                className={`rounded-full border px-3 py-1.5 text-sm ${reason === r ? "border-ink-900 bg-ink-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {willNeedApproval && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Clock size={14} /> This needs admin approval before stock changes.
        </p>
      )}

      <button
        className="btn-primary h-12 w-full text-base"
        disabled={qty < 1 || (max !== undefined && qty > max)}
      >
        {mode === "in"
          ? "Add to stock"
          : mode === "sale"
            ? "Record sale"
            : mode === "shelf"
              ? "Move to shelf"
              : willNeedApproval
                ? "Send for approval"
                : "Remove from stock"}
      </button>
    </form>
  );
}
