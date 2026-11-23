import type { GroceryItem, RawImport, Section } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DAY = 86_400_000;
export const today = () => new Date(new Date().toDateString());
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export const daysUntil = (iso: string) =>
  Math.round((new Date(iso + "T00:00:00").getTime() - today().getTime()) / DAY);

export const fmtDate = (iso: string) =>
  new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function fmtMoney(n: number, currency = "₹") {
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1e7) s = (abs / 1e7).toFixed(2) + " Cr";
  else if (abs >= 1e5) s = (abs / 1e5).toFixed(2) + " L";
  else s = abs.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return (n < 0 ? "-" : "") + currency + s;
}

export const fmtNum = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const totalQty = (i: GroceryItem) => i.storeQty + i.shelfQty;
export const isLow = (i: GroceryItem) => totalQty(i) <= i.reorderLevel;

export const rawExpiry = (r: RawImport) =>
  isoDate(addDays(new Date(r.arrivalDate + "T00:00:00"), r.shelfLifeDays));

export const SECTION_META: Record<Section, { label: string; color: string; href: string; blurb: string }> = {
  grocery: {
    label: "Grocery",
    color: "#1baf7a",
    href: "grocery",
    blurb: "Stock, shelf items, expiry, backlog & suspicious activity",
  },
  "bright-idea": {
    label: "Bright Idea",
    color: "#eb6834",
    href: "bright-idea",
    blurb: "Products by supplier & region with low-quantity alerts",
  },
  "raw-material": {
    label: "Raw Material",
    color: "#2a78d6",
    href: "raw-material",
    blurb: "Unprocessed food — grain, pulse, vegetables, meat. Import & export",
  },
};

// chart colours
export const SERIES = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function lastNMonths(n: number) {
  const d = today();
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`,
    });
  }
  return out;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
