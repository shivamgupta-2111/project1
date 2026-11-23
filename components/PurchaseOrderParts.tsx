"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { receivePO } from "@/lib/actions";
import type { POStatus, PurchaseOrder } from "@/lib/types";
import { Badge, Modal } from "@/components/ui";
import { poOverdue } from "@/lib/perf";

export const PO_TONE: Record<POStatus, "muted" | "info" | "warn" | "good" | "danger"> = {
  draft: "muted",
  sent: "info",
  partial: "warn",
  received: "good",
  cancelled: "danger",
};

export function POStatusBadge({ po }: { po: PurchaseOrder }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Badge tone={PO_TONE[po.status]}>{po.status}</Badge>
      {poOverdue(po) && <Badge tone="danger">overdue</Badge>}
    </span>
  );
}

export function Stars({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        </button>
      ))}
    </span>
  );
}

export function ReceivePOModal({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const { data, run, user } = useStore();
  const [qtys, setQtys] = useState(po.lines.map((l) => l.qty - l.receivedQty));
  const [rating, setRating] = useState(0);
  const [err, setErr] = useState("");
  const sup = data.suppliers.find((s) => s.id === po.supplierId);

  return (
    <Modal open onClose={onClose} title={`Receive ${po.poNo}`}>
      <p className="mb-3 text-sm text-slate-500">
        From <b className="text-slate-700">{sup?.name}</b>. Enter what actually arrived — stock is added
        straight away and the supplier bill is raised.
      </p>
      <div className="space-y-2">
        {po.lines.map((l, i) => {
          const left = l.qty - l.receivedQty;
          return (
            <div
              key={l.refId + i}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.name}</p>
                <p className="text-xs text-slate-500">
                  Ordered {l.qty} · received {l.receivedQty} · ₹{l.unitPrice}/unit
                </p>
              </div>
              <input
                type="number"
                min={0}
                max={left}
                disabled={left === 0}
                className="input w-24 text-right"
                value={qtys[i]}
                onChange={(e) => setQtys(qtys.map((q, j) => (j === i ? Number(e.target.value) : q)))}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-slate-600">Delivery rating</span>
        <Stars value={rating} onChange={setRating} size={20} />
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-4 flex justify-end">
        <button
          className="btn-primary"
          onClick={() => {
            const e = run((d) => receivePO(d, po.id, qtys, rating || undefined, user!.name));
            if (e) setErr(e);
            else onClose();
          }}
        >
          Confirm receipt
        </button>
      </div>
    </Modal>
  );
}
