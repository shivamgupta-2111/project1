"use client";

import { useCallback, useState } from "react";
import { ArrowRightLeft, Check, ClipboardList, PackageCheck, Plus, Truck } from "lucide-react";
import { useStore } from "@/lib/store";
import { performAction, recordTaskDone } from "@/lib/actions";
import type { PurchaseOrder, Task } from "@/lib/types";
import { Badge, Card, Field, Modal, PageHeader } from "@/components/ui";
import { ReceivePOModal } from "@/components/PurchaseOrderParts";
import { Toast } from "@/components/StockAction";
import { addDays, daysUntil, fmtDate, fmtDateTime, isoDate, today, uid } from "@/lib/utils";

const SHELF_MIN = 10;
const SHELF_FILL = 30;

function Row({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return <li className={`flex flex-wrap items-center gap-3 py-3 ${done ? "opacity-50" : ""}`}>{children}</li>;
}

function DueBadge({ date }: { date: string }) {
  const d = daysUntil(date);
  return (
    <Badge tone={d < 0 ? "danger" : d === 0 ? "warn" : "muted"}>
      {d < 0 ? `${-d}d overdue` : d === 0 ? "today" : d === 1 ? "tomorrow" : fmtDate(date)}
    </Badge>
  );
}

export default function TasksPage() {
  const { data, user, run } = useStore();
  const me = user!.name;
  const isAdmin = user!.role === "admin";
  const can = (s: string) => user!.sections.includes(s as never);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [adding, setAdding] = useState(false);
  const [who, setWho] = useState<string>("all");
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clear = useCallback(() => setResult(null), []);
  const tomorrow = isoDate(addDays(today(), 1));
  const todayIso = isoDate(today());

  const manual = data.tasks.filter(
    (t) =>
      !t.done &&
      t.createdBy !== "System" &&
      (isAdmin ? who === "all" || t.assignedTo === who : t.assignedTo === me || t.assignedTo === null),
  );
  const doneToday = data.tasks.filter(
    (t) => t.done && (t.doneAt ?? "").slice(0, 10) === todayIso && (isAdmin || t.doneBy === me),
  );

  const restock = can("grocery") ? data.grocery.filter((g) => g.shelfQty < SHELF_MIN && g.storeQty > 0) : [];
  const deliveries = data.purchaseOrders.filter(
    (p) => (p.status === "sent" || p.status === "partial") && p.expectedOn <= tomorrow && can(p.section),
  );
  const shipments = can("raw-material")
    ? data.exports.filter((x) => x.status === "preparing" && x.exportDate <= tomorrow)
    : [];
  const backlog = can("grocery")
    ? data.backlog.filter((b) => b.status !== "done" && b.dueOn <= todayIso)
    : [];
  const itemName = (id: string) => data.grocery.find((g) => g.id === id)?.name ?? "Item";

  const openCount = manual.length + restock.length + deliveries.length + shipments.length + backlog.length;
  const total = openCount + doneToday.length;
  const pct = total ? Math.round((doneToday.length / total) * 100) : 100;
  const supName = (id: string) => data.suppliers.find((s) => s.id === id)?.name ?? "Supplier";

  const completeTask = (t: Task) =>
    run((d) => {
      const x = d.tasks.find((y) => y.id === t.id)!;
      x.done = true;
      x.doneBy = me;
      x.doneAt = new Date().toISOString();
    });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={isAdmin ? "Daily tasks" : "My tasks today"}
        subtitle={today().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> {isAdmin ? "Assign task" : "Add task"}
          </button>
        }
      />

      <div className="card flex items-center gap-4 p-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#1baf7a"
              strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-xs font-semibold">{pct}%</span>
        </div>
        <div>
          <p className="font-semibold">
            {doneToday.length} done · {openCount} to do
          </p>
          <p className="text-sm text-slate-500">
            Restocks, deliveries, shipments and assigned tasks for today.
          </p>
        </div>
        {isAdmin && (
          <select className="input ml-auto w-auto" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="all">Everyone</option>
            {data.users
              .filter((u) => u.role === "rep")
              .map((u) => (
                <option key={u.id}>{u.name}</option>
              ))}
          </select>
        )}
      </div>

      <Card
        title="Assigned tasks"
        subtitle={isAdmin ? "Tasks you've given to reps" : "From your admin, or added by you"}
      >
        {manual.length === 0 ? (
          <p className="text-sm text-slate-500">No open tasks.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {manual
              .sort((a, b) => a.dueOn.localeCompare(b.dueOn))
              .map((t) => (
                <Row key={t.id}>
                  <button
                    onClick={() => completeTask(t)}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-slate-300 text-white hover:border-emerald-600 hover:bg-emerald-600"
                    aria-label="Mark done"
                  >
                    <Check size={14} />
                  </button>
                  <span className="min-w-0 flex-1 text-sm">
                    {t.title}
                    {isAdmin && (
                      <span className="block text-xs text-slate-500">{t.assignedTo ?? "Anyone"}</span>
                    )}
                  </span>
                  <DueBadge date={t.dueOn} />
                </Row>
              ))}
          </ul>
        )}
      </Card>

      {can("grocery") && (
        <Card
          title="Shelves to restock"
          subtitle={`Fewer than ${SHELF_MIN} on the shelf, with stock in the store room`}
        >
          {restock.length === 0 ? (
            <p className="text-sm text-slate-500">All shelves are stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {restock.map((g) => {
                const n = Math.min(g.storeQty, SHELF_FILL - g.shelfQty);
                return (
                  <Row key={g.id}>
                    <ArrowRightLeft size={16} className="text-slate-400" />
                    <span className="min-w-0 flex-1 text-sm">
                      {g.name}
                      <span className="block text-xs text-slate-500">
                        Shelf {g.shelfQty} · store room {g.storeQty}
                      </span>
                    </span>
                    <button
                      className="btn-ghost px-3 py-1.5 text-xs"
                      onClick={() => {
                        const err = run((d) => {
                          const e = performAction(d, { type: "grocery-move", itemId: g.id, qty: n }, me);
                          if (e) return e;
                          recordTaskDone(d, me, `Restocked ${g.name} (${n})`, "restock");
                        });
                        setResult(
                          err
                            ? { status: "error", message: err }
                            : { status: "applied", message: `Moved ${n} to shelf` },
                        );
                      }}
                    >
                      Move {n} to shelf
                    </button>
                  </Row>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {(can("grocery") || can("bright-idea")) && (
        <Card title="Deliveries to receive" subtitle="Purchase orders due today, tomorrow or overdue">
          {deliveries.length === 0 ? (
            <p className="text-sm text-slate-500">No deliveries expected.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {deliveries.map((p) => (
                <Row key={p.id}>
                  <PackageCheck size={16} className="text-slate-400" />
                  <span className="min-w-0 flex-1 text-sm">
                    {p.poNo} · {supName(p.supplierId)}
                    <span className="block text-xs text-slate-500">
                      {p.lines.length} items{p.status === "partial" && " · partly received"}
                    </span>
                  </span>
                  <DueBadge date={p.expectedOn} />
                  <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setReceiving(p)}>
                    Receive
                  </button>
                </Row>
              ))}
            </ul>
          )}
        </Card>
      )}

      {can("raw-material") && (
        <Card title="Shipments to send" subtitle="Raw material exports being prepared">
          {shipments.length === 0 ? (
            <p className="text-sm text-slate-500">No shipments due.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shipments.map((x) => (
                <Row key={x.id}>
                  <Truck size={16} className="text-slate-400" />
                  <span className="min-w-0 flex-1 text-sm">
                    {x.shipmentNo}: {x.product} {x.quantity.toLocaleString("en-IN")} kg
                    <span className="block text-xs text-slate-500">
                      {x.buyer} · {x.destination} · {x.carrier} {x.vehicleNo}
                    </span>
                  </span>
                  <DueBadge date={x.exportDate} />
                  <button
                    className="btn-primary px-3 py-1.5 text-xs"
                    onClick={() =>
                      run((d) => {
                        d.exports.find((e) => e.id === x.id)!.status = "shipped";
                        recordTaskDone(d, me, `Shipped ${x.shipmentNo}`, "ship");
                      })
                    }
                  >
                    Mark shipped
                  </button>
                </Row>
              ))}
            </ul>
          )}
        </Card>
      )}

      {backlog.length > 0 && (
        <Card title="Backlog due" subtitle="Grocery backlog items due today or overdue">
          <ul className="divide-y divide-slate-100">
            {backlog.map((b) => (
              <Row key={b.id}>
                <ClipboardList size={16} className="text-slate-400" />
                <span className="min-w-0 flex-1 text-sm">
                  {b.task}: {itemName(b.itemId)} × {b.qty}
                </span>
                <DueBadge date={b.dueOn} />
                <button
                  className="btn-ghost px-3 py-1.5 text-xs"
                  onClick={() =>
                    run((d) => {
                      d.backlog.find((y) => y.id === b.id)!.status = "done";
                      recordTaskDone(d, me, `${b.task}: ${itemName(b.itemId)}`, "other");
                    })
                  }
                >
                  Done
                </button>
              </Row>
            ))}
          </ul>
        </Card>
      )}

      {doneToday.length > 0 && (
        <Card title="Done today">
          <ul className="divide-y divide-slate-100">
            {doneToday.map((t) => (
              <Row key={t.id} done>
                <Check size={16} className="text-emerald-600" />
                <span className="min-w-0 flex-1 text-sm line-through">{t.title}</span>
                <span className="text-xs text-slate-500">
                  {isAdmin && `${t.doneBy} · `}
                  {fmtDateTime(t.doneAt!)}
                </span>
              </Row>
            ))}
          </ul>
        </Card>
      )}

      {receiving && <ReceivePOModal po={receiving} onClose={() => setReceiving(null)} />}
      {adding && <AddTask onClose={() => setAdding(false)} />}
      <Toast result={result} onDone={clear} />
    </div>
  );
}

function AddTask({ onClose }: { onClose: () => void }) {
  const { data, user, update } = useStore();
  const isAdmin = user!.role === "admin";
  const [f, setF] = useState({
    title: "",
    kind: "other" as Task["kind"],
    assignedTo: isAdmin ? "" : user!.name,
    dueOn: isoDate(today()),
  });
  return (
    <Modal open onClose={onClose} title={isAdmin ? "Assign a task" : "Add a task"}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          update((d) => {
            d.tasks.unshift({
              id: uid(),
              title: f.title,
              kind: f.kind,
              assignedTo: f.assignedTo || null,
              createdBy: user!.name,
              dueOn: f.dueOn,
              done: false,
            });
          });
          onClose();
        }}
      >
        <Field label="Task">
          <input
            className="input"
            required
            autoFocus
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="e.g. Count the dairy fridge"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select
              className="input"
              value={f.kind}
              onChange={(e) => setF({ ...f, kind: e.target.value as Task["kind"] })}
            >
              <option value="restock">Restock</option>
              <option value="receive">Receive delivery</option>
              <option value="ship">Shipment</option>
              <option value="count">Stock count</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Due">
            <input
              className="input"
              type="date"
              value={f.dueOn}
              onChange={(e) => setF({ ...f, dueOn: e.target.value })}
            />
          </Field>
        </div>
        {isAdmin && (
          <Field label="Assign to">
            <select
              className="input"
              value={f.assignedTo}
              onChange={(e) => setF({ ...f, assignedTo: e.target.value })}
            >
              <option value="">Anyone</option>
              {data.users
                .filter((u) => u.role === "rep" && u.active)
                .map((u) => (
                  <option key={u.id}>{u.name}</option>
                ))}
            </select>
          </Field>
        )}
        <div className="flex justify-end">
          <button className="btn-primary">Save task</button>
        </div>
      </form>
    </Modal>
  );
}
