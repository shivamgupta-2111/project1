import type { ErpData, PurchaseOrder } from "./types";
import { DAY, addDays, isoDate, today } from "./utils";

export function weekStart(d = today()) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(d, -day);
}
export const monthStart = (d = today()) => new Date(d.getFullYear(), d.getMonth(), 1);

export function repStats(d: ErpData, name: string) {
  const ws = isoDate(weekStart());
  const ms = isoDate(monthStart());
  const sales = d.transactions.filter((t) => t.type === "selling" && t.by === name);
  const done = d.tasks.filter((t) => t.done && t.doneBy === name);
  const acts = d.activity.filter((a) => a.userName === name);
  const salesWeek = sales.filter((t) => t.date >= ws).reduce((s, t) => s + t.amount, 0);
  const salesMonth = sales.filter((t) => t.date >= ms).reduce((s, t) => s + t.amount, 0);
  const tasksWeek = done.filter((t) => (t.doneAt ?? "").slice(0, 10) >= ws).length;
  const tasksMonth = done.filter((t) => (t.doneAt ?? "").slice(0, 10) >= ms).length;
  const activityWeek = acts.filter((a) => a.at.slice(0, 10) >= ws).length;
  const flags = acts.filter((a) => a.suspicious).length;
  const counts = d.counts.filter((c) => c.by === name);
  const countLines = counts.flatMap((c) => c.lines);
  const accuracy = countLines.length
    ? Math.round((countLines.filter((l) => l.counted === l.expected).length / countLines.length) * 100)
    : null;
  const reqs = d.approvals.filter((a) => a.requestedBy === name);
  const openTasks = d.tasks.filter((t) => !t.done && (t.assignedTo === name || t.assignedTo === null));

  const daily = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today(), i - 6);
    const key = isoDate(day);
    return {
      day: day.toLocaleDateString("en-IN", { weekday: "short" }),
      sales: sales.filter((t) => t.date === key).reduce((s, t) => s + t.amount, 0),
      tasks: done.filter((t) => (t.doneAt ?? "").slice(0, 10) === key).length,
    };
  });
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(weekStart(), (i - 7) * 7);
    const end = addDays(start, 7);
    const a = isoDate(start);
    const b = isoDate(end);
    return {
      week: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      sales: sales.filter((t) => t.date >= a && t.date < b).reduce((s, t) => s + t.amount, 0),
      tasks: done.filter((t) => (t.doneAt ?? "").slice(0, 10) >= a && (t.doneAt ?? "").slice(0, 10) < b)
        .length,
    };
  });

  return {
    salesWeek,
    salesMonth,
    tasksWeek,
    tasksMonth,
    activityWeek,
    flags,
    counts: counts.length,
    accuracy,
    pendingRequests: reqs.filter((r) => r.status === "pending").length,
    rejectedRequests: reqs.filter((r) => r.status === "rejected").length,
    openTasks: openTasks.length,
    daily,
    weekly,
  };
}

export function supplierStats(d: ErpData, supplierId: string) {
  const s = d.suppliers.find((x) => x.id === supplierId)!;
  const pos = d.purchaseOrders.filter((p) => p.supplierId === supplierId);
  const received = pos.filter((p) => p.receivedOn);
  const onTime = received.filter((p) => p.receivedOn! <= p.expectedOn).length;
  const rated = received.filter((p) => p.rating);
  const bills = d.transactions.filter((t) => t.type === "buying" && t.party === s.name);
  const owed = bills.filter((t) => !t.paid).reduce((a, t) => a + t.amount, 0);
  const purchased = bills.reduce((a, t) => a + t.amount, 0);
  const importsCost = d.imports.filter((i) => i.supplier === s.name);
  return {
    pos,
    open: pos.filter((p) => p.status === "sent" || p.status === "partial").length,
    onTimePct: received.length ? Math.round((onTime / received.length) * 100) : null,
    rating: rated.length ? rated.reduce((a, p) => a + (p.rating ?? 0), 0) / rated.length : null,
    owed,
    purchased,
    bills,
    importsCost,
  };
}

export const poValue = (p: PurchaseOrder) => p.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
export const poOverdue = (p: PurchaseOrder) =>
  (p.status === "sent" || p.status === "partial") &&
  new Date(p.expectedOn + "T00:00:00").getTime() < today().getTime();
export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);
