"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ApprovalRequest, ErpData } from "@/lib/types";
import { Badge, Card, NoAccess, PageHeader, StatCard, TabButtons, Table } from "@/components/ui";
import { SECTION_META, fmtDateTime, fmtMoney, totalQty } from "@/lib/utils";

function stockContext(d: ErpData, r: ApprovalRequest): string | null {
  const a = r.action;
  if (a.type === "grocery-adjust") {
    const g = d.grocery.find((x) => x.id === a.itemId);
    if (!g) return null;
    const now = g[a.where];
    return `${a.where === "shelfQty" ? "Shelf" : "Store room"} now ${now} → ${Math.max(0, now + a.delta)} after`;
  }
  if (a.type === "grocery-writeoff") {
    const g = d.grocery.find((x) => x.id === a.itemId);
    return g ? `Total stock now ${totalQty(g)} → ${Math.max(0, totalQty(g) - a.qty)} after` : null;
  }
  if (a.type === "bright-adjust") {
    const b = d.bright.find((x) => x.id === a.productId);
    return b
      ? `Quantity now ${b.quantity} → ${Math.max(0, b.quantity + a.delta)} after (alert below ${b.minQuantity})`
      : null;
  }
  if (a.type === "raw-export") {
    const p = a.shipment.product;
    const bal =
      d.imports.filter((i) => i.product === p).reduce((s, i) => s + i.quantity, 0) -
      d.exports.filter((e) => e.product === p).reduce((s, e) => s + e.quantity, 0);
    return `${p} in stock: ${bal.toLocaleString("en-IN")} kg → ${(bal - a.shipment.quantity).toLocaleString("en-IN")} kg after`;
  }
  return null;
}

const KIND_TONE = { Adjustment: "info", "Write-off": "danger", Export: "warn" } as const;

export default function Approvals() {
  const { data, user, decide } = useStore();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<{ id: string; msg: string } | null>(null);
  if (user!.role !== "admin") return <NoAccess />;

  const pending = data.approvals.filter((a) => a.status === "pending");
  const history = data.approvals.filter((a) => a.status !== "pending");
  const decidedThisWeek = history.filter(
    (h) => h.decidedAt && Date.now() - new Date(h.decidedAt).getTime() < 7 * 86_400_000,
  );

  const act = (id: string, ok: boolean, n?: string) => {
    const err = decide(id, ok, n);
    if (err) setError({ id, msg: err });
    else {
      setRejecting(null);
      setNote("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        subtitle="Reps' big adjustments, write-offs and exports wait here. Nothing changes in stock until you approve."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Waiting for you" value={pending.length} tone={pending.length ? "warn" : "good"} />
        <StatCard label="Value waiting" value={fmtMoney(pending.reduce((s, p) => s + p.value, 0))} />
        <StatCard
          label="Approved this week"
          value={decidedThisWeek.filter((h) => h.status === "approved").length}
        />
        <StatCard
          label="Rejected this week"
          value={decidedThisWeek.filter((h) => h.status === "rejected").length}
        />
      </div>

      <TabButtons
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "pending", label: "Pending", count: pending.length },
          { id: "history", label: "History", count: history.length },
        ]}
      />

      {tab === "pending" ? (
        pending.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-slate-500">Nothing waiting for approval. 🎉</p>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={KIND_TONE[r.kind]}>{r.kind}</Badge>
                  <span className="badge bg-slate-100 text-slate-700">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: SECTION_META[r.section].color }}
                    />
                    {SECTION_META[r.section].label}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{fmtDateTime(r.at)}</span>
                </div>
                <p className="mt-3 font-medium text-slate-900">{r.summary}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Requested by <b className="font-medium text-slate-700">{r.requestedBy}</b> · Value{" "}
                  {fmtMoney(r.value)}
                </p>
                {stockContext(data, r) && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {stockContext(data, r)}
                  </p>
                )}
                {error?.id === r.id && (
                  <p className="mt-2 text-sm text-red-600">Couldn&apos;t apply: {error.msg}</p>
                )}
                {rejecting === r.id ? (
                  <div className="mt-4 space-y-2">
                    <input
                      className="input"
                      autoFocus
                      placeholder="Reason for rejecting (the rep will see this)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost" onClick={() => setRejecting(null)}>
                        Cancel
                      </button>
                      <button className="btn-danger" onClick={() => act(r.id, false, note || undefined)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-end gap-2">
                    <button className="btn-ghost" onClick={() => setRejecting(r.id)}>
                      <X size={16} /> Reject
                    </button>
                    <button
                      className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => act(r.id, true)}
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <Table
          empty={!history.length}
          head={
            <tr>
              <th className="th">Requested</th>
              <th className="th">By</th>
              <th className="th">Type</th>
              <th className="th">Details</th>
              <th className="th text-right">Value</th>
              <th className="th">Decision</th>
              <th className="th">Note</th>
            </tr>
          }
        >
          {history.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="td">{fmtDateTime(r.at)}</td>
              <td className="td">{r.requestedBy}</td>
              <td className="td">
                <Badge tone={KIND_TONE[r.kind]}>{r.kind}</Badge>
              </td>
              <td className="td whitespace-normal">{r.summary}</td>
              <td className="td text-right tabular-nums">{fmtMoney(r.value)}</td>
              <td className="td">
                <Badge tone={r.status === "approved" ? "good" : "danger"}>{r.status}</Badge>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.decidedBy} · {r.decidedAt && fmtDateTime(r.decidedAt)}
                </p>
              </td>
              <td className="td whitespace-normal text-slate-500">{r.note ?? "—"}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
