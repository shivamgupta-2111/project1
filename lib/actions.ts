// all stock changes go through performAction so approvals can replay them later
import type { ActivityLog, ApprovalRequest, ErpAction, ErpData, Section, User } from "./types";
import { isoDate, today, totalQty, uid } from "./utils";

export function detectSuspicious(action: string, delta: number, at: Date): string | undefined {
  const reasons: string[] = [];
  if (delta <= -25 && /adjust|write-off|remove|delete|count/i.test(action))
    reasons.push("Large negative adjustment");
  if (at.getHours() < 6 || at.getHours() >= 23) reasons.push("Activity outside working hours");
  if (Math.abs(delta) >= 500) reasons.push("Unusually large quantity change");
  return reasons.length ? reasons.join("; ") : undefined;
}

export function pushActivity(
  d: ErpData,
  e: { section: Section; action: string; itemName: string; delta: number; userName: string },
) {
  const at = new Date();
  const reason = detectSuspicious(e.action, e.delta, at);
  const entry: ActivityLog = {
    id: uid(),
    at: at.toISOString(),
    ...e,
    suspicious: !!reason,
    reason,
    reviewed: false,
  };
  d.activity.unshift(entry);
}

export function sectionOf(a: ErpAction): Section {
  if (a.type.startsWith("grocery")) return "grocery";
  if (a.type.startsWith("bright")) return "bright-idea";
  return "raw-material";
}

export function describe(
  d: ErpData,
  a: ErpAction,
): { kind: ApprovalRequest["kind"]; summary: string; value: number } {
  switch (a.type) {
    case "grocery-adjust": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      return {
        kind: "Adjustment",
        summary: `${g?.name ?? "Item"}: ${a.delta > 0 ? "+" : ""}${a.delta} (${a.where === "shelfQty" ? "shelf" : "store room"}) — ${a.reason}`,
        value: Math.abs(a.delta) * (g?.costPrice ?? 0),
      };
    }
    case "grocery-writeoff": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      return {
        kind: "Write-off",
        summary: `${g?.name ?? "Item"}: write off ${a.qty} — ${a.reason}`,
        value: a.qty * (g?.costPrice ?? 0),
      };
    }
    case "bright-adjust": {
      const b = d.bright.find((x) => x.id === a.productId);
      return {
        kind: a.delta < 0 && /damag|expir|write/i.test(a.reason) ? "Write-off" : "Adjustment",
        summary: `${b?.productName ?? "Product"}: ${a.delta > 0 ? "+" : ""}${a.delta} — ${a.reason}`,
        value: Math.abs(a.delta) * (b?.unitPrice ?? 0),
      };
    }
    case "raw-export":
      return {
        kind: "Export",
        summary: `${a.shipment.shipmentNo}: ${a.shipment.product} ${a.shipment.quantity} kg → ${a.shipment.buyer}, ${a.shipment.destination}`,
        value: a.shipment.quantity * a.shipment.pricePerKg,
      };
    default:
      return { kind: "Adjustment", summary: a.type, value: 0 };
  }
}

export function needsApproval(d: ErpData, user: User, a: ErpAction): boolean {
  if (user.role === "admin") return false;
  const s = d.settings;
  switch (a.type) {
    case "grocery-adjust":
    case "bright-adjust":
      if (
        a.type === "bright-adjust" &&
        a.delta < 0 &&
        /damag|expir|write/i.test(a.reason) &&
        s.approveWriteOffs
      )
        return true;
      return Math.abs(a.delta) >= s.approvalThreshold;
    case "grocery-writeoff":
      return s.approveWriteOffs || a.qty >= s.approvalThreshold;
    case "raw-export":
      return s.approveExports;
    default:
      return false;
  }
}

// returns an error string if it fails, null if ok
export function performAction(d: ErpData, a: ErpAction, actor: string): string | null {
  const date = isoDate(today());
  switch (a.type) {
    case "grocery-receive": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      if (!g) return "Item not found";
      g.storeQty += a.qty;
      d.transactions.unshift({
        id: uid(),
        date,
        type: "buying",
        section: "grocery",
        description: `Stock received: ${g.name} × ${a.qty}`,
        party: g.supplier,
        amount: a.qty * g.costPrice,
        paid: false,
        archived: false,
        by: actor,
      });
      pushActivity(d, {
        section: "grocery",
        action: "Stock received",
        itemName: g.name,
        delta: a.qty,
        userName: actor,
      });
      return null;
    }
    case "grocery-adjust": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      if (!g) return "Item not found";
      g[a.where] = Math.max(0, g[a.where] + a.delta);
      pushActivity(d, {
        section: "grocery",
        action: `Adjustment (${a.reason})`,
        itemName: g.name,
        delta: a.delta,
        userName: actor,
      });
      return null;
    }
    case "grocery-writeoff": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      if (!g) return "Item not found";
      let left = Math.min(a.qty, totalQty(g));
      const fromShelf = Math.min(left, g.shelfQty);
      g.shelfQty -= fromShelf;
      left -= fromShelf;
      g.storeQty = Math.max(0, g.storeQty - left);
      pushActivity(d, {
        section: "grocery",
        action: `Write-off (${a.reason})`,
        itemName: g.name,
        delta: -a.qty,
        userName: actor,
      });
      return null;
    }
    case "grocery-move": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      if (!g) return "Item not found";
      const n = Math.min(a.qty, g.storeQty);
      if (n <= 0) return "Nothing in the store room";
      g.storeQty -= n;
      g.shelfQty += n;
      pushActivity(d, {
        section: "grocery",
        action: "Moved to shelf",
        itemName: g.name,
        delta: 0,
        userName: actor,
      });
      return null;
    }
    case "grocery-sell": {
      const g = d.grocery.find((x) => x.id === a.itemId);
      if (!g) return "Item not found";
      if (a.qty > totalQty(g)) return `Only ${totalQty(g)} in stock`;
      const fromShelf = Math.min(a.qty, g.shelfQty);
      g.shelfQty -= fromShelf;
      g.storeQty -= a.qty - fromShelf;
      d.transactions.unshift({
        id: uid(),
        date,
        type: "selling",
        section: "grocery",
        description: `Sale: ${g.name} × ${a.qty}`,
        party: "Walk-in customer",
        amount: a.qty * g.sellPrice,
        paid: true,
        archived: false,
        by: actor,
      });
      pushActivity(d, {
        section: "grocery",
        action: "Sold",
        itemName: g.name,
        delta: -a.qty,
        userName: actor,
      });
      return null;
    }
    case "bright-in": {
      const b = d.bright.find((x) => x.id === a.productId);
      if (!b) return "Product not found";
      b.quantity += a.qty;
      pushActivity(d, {
        section: "bright-idea",
        action: "Stock received",
        itemName: b.productName,
        delta: a.qty,
        userName: actor,
      });
      return null;
    }
    case "bright-sell": {
      const b = d.bright.find((x) => x.id === a.productId);
      if (!b) return "Product not found";
      if (a.qty > b.quantity) return `Only ${b.quantity} in stock`;
      b.quantity -= a.qty;
      d.transactions.unshift({
        id: uid(),
        date,
        type: "selling",
        section: "bright-idea",
        description: `Sale: ${b.productName} × ${a.qty}`,
        party: "Dealer / counter",
        amount: a.qty * b.unitPrice,
        paid: true,
        archived: false,
        by: actor,
      });
      pushActivity(d, {
        section: "bright-idea",
        action: "Sold",
        itemName: b.productName,
        delta: -a.qty,
        userName: actor,
      });
      return null;
    }
    case "bright-adjust": {
      const b = d.bright.find((x) => x.id === a.productId);
      if (!b) return "Product not found";
      b.quantity = Math.max(0, b.quantity + a.delta);
      pushActivity(d, {
        section: "bright-idea",
        action: `Adjustment (${a.reason})`,
        itemName: b.productName,
        delta: a.delta,
        userName: actor,
      });
      return null;
    }
    case "raw-export": {
      const x = a.shipment;
      const bal =
        d.imports.filter((i) => i.product === x.product).reduce((s, i) => s + i.quantity, 0) -
        d.exports.filter((e) => e.product === x.product).reduce((s, e) => s + e.quantity, 0);
      if (x.quantity > bal) return `Only ${bal} kg of ${x.product} left`;
      d.exports.unshift(x);
      d.exports.sort((p, q) => q.exportDate.localeCompare(p.exportDate));
      d.transactions.unshift({
        id: uid(),
        date: x.exportDate,
        type: "selling",
        section: "raw-material",
        description: `Export ${x.shipmentNo}: ${x.product} ${x.quantity} kg`,
        party: x.buyer,
        amount: x.quantity * x.pricePerKg,
        paid: false,
        archived: false,
        by: actor,
      });
      pushActivity(d, {
        section: "raw-material",
        action: "Export shipped",
        itemName: x.product,
        delta: -x.quantity,
        userName: actor,
      });
      return null;
    }
  }
}

// logs a finished task so it shows up in performance
export function recordTaskDone(
  d: ErpData,
  actor: string,
  title: string,
  kind: "restock" | "receive" | "ship" | "count" | "other",
) {
  const now = new Date().toISOString();
  d.tasks.unshift({
    id: uid(),
    title,
    kind,
    assignedTo: actor,
    createdBy: "System",
    dueOn: isoDate(today()),
    done: true,
    doneBy: actor,
    doneAt: now,
  });
}

export function receivePO(
  d: ErpData,
  poId: string,
  qtys: number[],
  rating: number | undefined,
  actor: string,
): string | null {
  const po = d.purchaseOrders.find((p) => p.id === poId);
  if (!po) return "PO not found";
  const sup = d.suppliers.find((s) => s.id === po.supplierId);
  let value = 0;
  po.lines.forEach((l, i) => {
    const n = Math.max(0, Math.min(qtys[i] ?? 0, l.qty - l.receivedQty));
    if (!n) return;
    l.receivedQty += n;
    value += n * l.unitPrice;
    if (po.section === "grocery") {
      const g = d.grocery.find((x) => x.id === l.refId);
      if (g) {
        g.storeQty += n;
        g.costPrice = l.unitPrice;
      }
    } else {
      const b = d.bright.find((x) => x.id === l.refId);
      if (b) b.quantity += n;
    }
    pushActivity(d, {
      section: po.section,
      action: `Received on ${po.poNo}`,
      itemName: l.name,
      delta: n,
      userName: actor,
    });
  });
  if (!value) return "Enter at least one quantity to receive";
  const complete = po.lines.every((l) => l.receivedQty >= l.qty);
  po.status = complete ? "received" : "partial";
  if (complete) po.receivedOn = isoDate(today());
  if (rating) po.rating = rating;
  d.transactions.unshift({
    id: uid(),
    date: isoDate(today()),
    type: "buying",
    section: po.section,
    description: `${po.poNo} goods received`,
    party: sup?.name ?? "Supplier",
    amount: value,
    paid: false,
    archived: false,
    by: actor,
  });
  recordTaskDone(d, actor, `Received ${po.poNo} from ${sup?.name ?? "supplier"}`, "receive");
  return null;
}

export function submitInDraft(
  d: ErpData,
  user: User,
  a: ErpAction,
): { status: "applied" | "pending" | "error"; message: string } {
  if (needsApproval(d, user, a)) {
    const info = describe(d, a);
    d.approvals.unshift({
      id: uid(),
      at: new Date().toISOString(),
      requestedBy: user.name,
      section: sectionOf(a),
      ...info,
      action: a,
      status: "pending",
      seenByRequester: true,
    });
    return { status: "pending", message: "Sent to admin for approval" };
  }
  const err = performAction(d, a, user.name);
  return err ? { status: "error", message: err } : { status: "applied", message: "Saved" };
}
