"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCheck, Eye, EyeOff, ScanLine } from "lucide-react";
import { useStore } from "@/lib/store";
import { recordTaskDone, submitInDraft } from "@/lib/actions";
import type { StockCount, StockCountLine } from "@/lib/types";
import { Badge, Card, Modal, PageHeader, StatCard, Table } from "@/components/ui";
import Scanner from "@/components/Scanner";
import { Toast, findByCode } from "@/components/StockAction";
import { SECTION_META, fmtDateTime, fmtMoney, uid } from "@/lib/utils";

type Loc = { key: string; section: "grocery" | "bright-idea"; location: string; label: string };

export default function StockCountPage() {
  const { data, user, run } = useStore();
  const isAdmin = user!.role === "admin";
  const [active, setActive] = useState<{ loc: Loc; lines: (StockCountLine & { entered: string })[] } | null>(
    null,
  );
  const [blind, setBlind] = useState(!isAdmin);
  const [reviewing, setReviewing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [viewing, setViewing] = useState<StockCount | null>(null);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clear = useCallback(() => setResult(null), []);

  const locations: Loc[] = useMemo(() => {
    const out: Loc[] = [];
    if (user!.sections.includes("grocery")) {
      out.push({ key: "g-shelf", section: "grocery", location: "Shelf", label: "Grocery — shelves" });
      out.push({ key: "g-store", section: "grocery", location: "Store room", label: "Grocery — store room" });
    }
    if (user!.sections.includes("bright-idea"))
      for (const r of [...new Set(data.bright.map((b) => b.region))])
        out.push({ key: `b-${r}`, section: "bright-idea", location: r, label: `Bright Idea — ${r} region` });
    return out;
  }, [data.bright, user]);

  const start = (loc: Loc) => {
    const lines =
      loc.section === "grocery"
        ? data.grocery.map((g) => ({
            refId: g.id,
            name: g.name,
            expected: loc.location === "Shelf" ? g.shelfQty : g.storeQty,
            counted: 0,
            entered: "",
          }))
        : data.bright
            .filter((b) => b.region === loc.location)
            .map((b) => ({
              refId: b.id,
              name: b.productName,
              expected: b.quantity,
              counted: 0,
              entered: "",
            }));
    setActive({ loc, lines });
    setReviewing(false);
  };

  const setEntered = (i: number, v: string) =>
    setActive((a) => a && { ...a, lines: a.lines.map((l, j) => (j === i ? { ...l, entered: v } : l)) });

  const onScan = (code: string) => {
    if (!active) return;
    const ref = findByCode(data, code, user!.sections);
    const i = ref ? active.lines.findIndex((l) => l.refId === ref.id) : -1;
    if (i < 0) return setResult({ status: "error", message: "Not in this count location" });
    const now = Number(active.lines[i].entered || 0) + 1;
    setEntered(i, String(now));
    setResult({ status: "applied", message: `${active.lines[i].name}: ${now}` });
  };

  const counted = active?.lines.filter((l) => l.entered !== "") ?? [];
  const variances = counted
    .map((l) => ({ ...l, counted: Number(l.entered), diff: Number(l.entered) - l.expected }))
    .filter((l) => l.diff !== 0);
  const unitCost = (refId: string) =>
    data.grocery.find((g) => g.id === refId)?.costPrice ??
    data.bright.find((b) => b.id === refId)?.unitPrice ??
    0;

  const post = () => {
    if (!active) return;
    let pending = 0;
    const err = run((d) => {
      for (const v of variances) {
        const r =
          active.loc.section === "grocery"
            ? submitInDraft(d, user!, {
                type: "grocery-adjust",
                itemId: v.refId,
                delta: v.diff,
                reason: "Stock count",
                where: active.loc.location === "Shelf" ? "shelfQty" : "storeQty",
              })
            : submitInDraft(d, user!, {
                type: "bright-adjust",
                productId: v.refId,
                delta: v.diff,
                reason: "Stock count",
              });
        if (r.status === "pending") pending++;
        if (r.status === "error") return r.message;
      }
      d.counts.unshift({
        id: uid(),
        at: new Date().toISOString(),
        by: user!.name,
        section: active.loc.section,
        location: active.loc.location,
        lines: counted.map((l) => ({
          refId: l.refId,
          name: l.name,
          expected: l.expected,
          counted: Number(l.entered),
        })),
        posted: true,
      });
      recordTaskDone(d, user!.name, `Stock count: ${active.loc.label}`, "count");
    });
    if (err) return setResult({ status: "error", message: err });
    setResult({
      status: pending ? "pending" : "applied",
      message: pending
        ? `Count saved · ${pending} adjustment${pending > 1 ? "s" : ""} sent for approval`
        : "Count saved and stock updated",
    });
    setActive(null);
  };

  const history = data.counts.filter((c) => isAdmin || c.by === user!.name);
  const acc = (c: StockCount) =>
    c.lines.length
      ? Math.round((c.lines.filter((l) => l.counted === l.expected).length / c.lines.length) * 100)
      : 100;

  // choose location
  if (!active)
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Stock count"
          subtitle="Count what's physically there. The system shows any difference from its records."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {locations.map((l) => (
            <button
              key={l.key}
              onClick={() => start(l)}
              className="card flex items-center gap-3 p-4 text-left transition hover:shadow-md"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-lg text-white"
                style={{ background: SECTION_META[l.section].color }}
              >
                <ClipboardCheck size={18} />
              </span>
              <span>
                <span className="block font-medium">{l.label}</span>
                <span className="text-xs text-slate-500">Start counting →</span>
              </span>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <Table
            head={
              <tr>
                <th className="th">When</th>
                <th className="th">Location</th>
                {isAdmin && <th className="th">Counted by</th>}
                <th className="th text-right">Items</th>
                <th className="th text-right">Differences</th>
                <th className="th">Accuracy</th>
              </tr>
            }
          >
            {history.map((c) => (
              <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setViewing(c)}>
                <td className="td">{fmtDateTime(c.at)}</td>
                <td className="td">
                  {SECTION_META[c.section].label} — {c.location}
                </td>
                {isAdmin && <td className="td">{c.by}</td>}
                <td className="td text-right tabular-nums">{c.lines.length}</td>
                <td className="td text-right tabular-nums">
                  {c.lines.filter((l) => l.counted !== l.expected).length}
                </td>
                <td className="td">
                  <Badge tone={acc(c) >= 90 ? "good" : acc(c) >= 75 ? "warn" : "danger"}>{acc(c)}%</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}

        <Modal
          open={!!viewing}
          onClose={() => setViewing(null)}
          title={viewing ? `${viewing.location} count · ${viewing.by}` : ""}
        >
          {viewing && (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="th pl-0">Item</th>
                    <th className="th text-right">System</th>
                    <th className="th text-right">Counted</th>
                    <th className="th text-right">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewing.lines.map((l) => (
                    <tr key={l.refId}>
                      <td className="td pl-0">{l.name}</td>
                      <td className="td text-right tabular-nums">{l.expected}</td>
                      <td className="td text-right tabular-nums">{l.counted}</td>
                      <td
                        className={`td text-right font-medium tabular-nums ${l.counted - l.expected < 0 ? "text-red-700" : l.counted - l.expected > 0 ? "text-emerald-700" : "text-slate-400"}`}
                      >
                        {l.counted - l.expected > 0 ? "+" : ""}
                        {l.counted - l.expected}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
        <Toast result={result} onDone={clear} />
      </div>
    );

  // review
  if (reviewing) {
    const valueDiff = variances.reduce((s, v) => s + v.diff * unitCost(v.refId), 0);
    const accuracy = counted.length
      ? Math.round(((counted.length - variances.length) / counted.length) * 100)
      : 100;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Review count" subtitle={active.loc.label} />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Items counted" value={`${counted.length}/${active.lines.length}`} />
          <StatCard label="Accuracy" value={`${accuracy}%`} tone={accuracy >= 90 ? "good" : "warn"} />
          <StatCard
            label="Value difference"
            value={fmtMoney(valueDiff)}
            tone={valueDiff < 0 ? "danger" : "default"}
          />
        </div>
        <Card
          title={
            variances.length ? `${variances.length} differences found` : "No differences — records match 🎉"
          }
        >
          {variances.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {variances.map((v) => (
                <li key={v.refId} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">{v.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {v.expected} → {v.counted}
                  </span>
                  <span
                    className={`w-14 text-right font-semibold tabular-nums ${v.diff < 0 ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {v.diff > 0 ? "+" : ""}
                    {v.diff}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!isAdmin && variances.some((v) => Math.abs(v.diff) >= data.settings.approvalThreshold) && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Differences of {data.settings.approvalThreshold}+ units go to admin for approval before stock
              changes.
            </p>
          )}
        </Card>
        <div className="flex gap-2">
          <button className="btn-ghost h-12 flex-1" onClick={() => setReviewing(false)}>
            Back to counting
          </button>
          <button className="btn-primary h-12 flex-1" onClick={post} disabled={!counted.length}>
            {variances.length ? "Save & post adjustments" : "Save count"}
          </button>
        </div>
        <Toast result={result} onDone={clear} />
      </div>
    );
  }

  // counting
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={active.loc.label}
        subtitle={`${counted.length} of ${active.lines.length} counted`}
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={() => setBlind(!blind)}
              title="Show or hide system quantities"
            >
              {blind ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
              {blind ? "Blind count" : "Showing system qty"}
            </button>
            <button className="btn-ghost" onClick={() => setScanning(true)}>
              <ScanLine size={16} /> Scan to count
            </button>
          </>
        }
      />
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-emerald-600 transition-all"
          style={{ width: `${(counted.length / Math.max(1, active.lines.length)) * 100}%` }}
        />
      </div>
      <ul className="card divide-y divide-slate-100">
        {active.lines.map((l, i) => {
          const diff = l.entered === "" ? null : Number(l.entered) - l.expected;
          return (
            <li key={l.refId} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1 text-sm">
                {l.name}
                {!blind && <span className="block text-xs text-slate-500">System: {l.expected}</span>}
              </span>
              {!blind && diff !== null && diff !== 0 && (
                <span
                  className={`text-xs font-semibold tabular-nums ${diff < 0 ? "text-red-700" : "text-emerald-700"}`}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}
                </span>
              )}
              <input
                className="input w-24 text-right tabular-nums"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="—"
                value={l.entered}
                onChange={(e) => setEntered(i, e.target.value)}
              />
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-20 flex gap-2 lg:bottom-4">
        <button
          className="btn-ghost h-12 flex-1 shadow-sm"
          onClick={() => confirm("Discard this count?") && setActive(null)}
        >
          Cancel
        </button>
        <button
          className="btn-primary h-12 flex-1 shadow-sm"
          disabled={!counted.length}
          onClick={() => setReviewing(true)}
        >
          Review differences
        </button>
      </div>
      <Modal open={scanning} onClose={() => setScanning(false)} title="Scan to count (+1 per scan)">
        {scanning && <Scanner onResult={onScan} />}
        <button className="btn-primary mt-3 w-full" onClick={() => setScanning(false)}>
          Done scanning
        </button>
      </Modal>
      <Toast result={result} onDone={clear} />
    </div>
  );
}
