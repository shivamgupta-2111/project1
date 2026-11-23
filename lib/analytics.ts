import type { ErpData, RawCategory, Transaction } from "./types";
import { RAW_CATEGORIES } from "./types";
import { lastNMonths, totalQty } from "./utils";

export function monthlyTxn(txns: Transaction[], months = 6) {
  const ms = lastNMonths(months);
  return ms.map(({ key, label }) => {
    const inMonth = txns.filter((t) => t.date.startsWith(key));
    const sum = (f: (t: Transaction) => boolean) => inMonth.filter(f).reduce((s, t) => s + t.amount, 0);
    return {
      month: label,
      key,
      buying: sum((t) => t.type === "buying"),
      selling: sum((t) => t.type === "selling"),
      expense: sum((t) => t.type === "expense"),
      grocery: sum((t) => t.type === "selling" && t.section === "grocery"),
      bright: sum((t) => t.type === "selling" && t.section === "bright-idea"),
      raw: sum((t) => t.type === "selling" && t.section === "raw-material"),
    };
  });
}

export function rawStock(d: ErpData) {
  const map = new Map<
    string,
    { product: string; category: RawCategory; imported: number; exported: number }
  >();
  for (const i of d.imports) {
    const e = map.get(i.product) ?? { product: i.product, category: i.category, imported: 0, exported: 0 };
    e.imported += i.quantity;
    map.set(i.product, e);
  }
  for (const x of d.exports) {
    const e = map.get(x.product) ?? { product: x.product, category: x.category, imported: 0, exported: 0 };
    e.exported += x.quantity;
    map.set(x.product, e);
  }
  return [...map.values()].map((e) => ({ ...e, balance: e.imported - e.exported }));
}

export function rawByCategory(d: ErpData) {
  return RAW_CATEGORIES.map((c) => ({
    category: c,
    imported: d.imports.filter((i) => i.category === c).reduce((s, i) => s + i.quantity, 0),
    exported: d.exports.filter((i) => i.category === c).reduce((s, i) => s + i.quantity, 0),
  }));
}

export function rawMonthly(d: ErpData, months = 6) {
  return lastNMonths(months).map(({ key, label }) => ({
    month: label,
    imported: d.imports.filter((i) => i.arrivalDate.startsWith(key)).reduce((s, i) => s + i.quantity, 0),
    exported: d.exports.filter((i) => i.exportDate.startsWith(key)).reduce((s, i) => s + i.quantity, 0),
  }));
}

export function groceryByCategory(d: ErpData) {
  const map = new Map<string, { category: string; store: number; shelf: number }>();
  for (const g of d.grocery) {
    const e = map.get(g.category) ?? { category: g.category, store: 0, shelf: 0 };
    e.store += g.storeQty;
    e.shelf += g.shelfQty;
    map.set(g.category, e);
  }
  return [...map.values()].sort((a, b) => b.store + b.shelf - (a.store + a.shelf));
}

export function stockValues(d: ErpData) {
  const grocery = d.grocery.reduce((s, g) => s + totalQty(g) * g.costPrice, 0);
  const bright = d.bright.reduce((s, b) => s + b.quantity * b.unitPrice, 0);
  const costOf = new Map<string, number>();
  for (const i of d.imports) costOf.set(i.product, i.costPerKg);
  const raw = rawStock(d).reduce((s, r) => s + Math.max(0, r.balance) * (costOf.get(r.product) ?? 0), 0);
  return { grocery, bright, raw, total: grocery + bright + raw };
}
