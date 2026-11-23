"use client";

import Link from "next/link";
import { Lightbulb, ShoppingBasket, Wheat } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { SECTION_META, daysUntil, fmtNum, isLow } from "@/lib/utils";
import { rawStock } from "@/lib/analytics";
import type { Section } from "@/lib/types";

const ICONS: Record<Section, React.ElementType> = {
  grocery: ShoppingBasket,
  "bright-idea": Lightbulb,
  "raw-material": Wheat,
};

export default function WarehouseHome() {
  const { data, user } = useStore();
  const base = `/${user!.role}/warehouse`;
  const rawBal = rawStock(data).reduce((s, r) => s + Math.max(0, r.balance), 0);

  const stats: Record<Section, [string, string][]> = {
    grocery: [
      ["Items", String(data.grocery.length)],
      ["Low stock", String(data.grocery.filter(isLow).length)],
      ["Expired", String(data.grocery.filter((g) => daysUntil(g.expiryDate) < 0).length)],
    ],
    "bright-idea": [
      ["Products", String(data.bright.length)],
      ["Regions", String(new Set(data.bright.map((b) => b.region)).size)],
      ["Low qty", String(data.bright.filter((b) => b.quantity < b.minQuantity).length)],
    ],
    "raw-material": [
      ["In stock (kg)", fmtNum(rawBal)],
      ["Imports", String(data.imports.length)],
      ["Exports", String(data.exports.length)],
    ],
  };

  return (
    <div>
      <PageHeader title="Warehouse" subtitle="Choose a part of the warehouse to work in." />
      <div className="grid gap-5 md:grid-cols-3">
        {user!.sections.map((s) => {
          const m = SECTION_META[s];
          const Icon = ICONS[s];
          return (
            <Link
              key={s}
              href={`${base}/${m.href}`}
              className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="h-1.5" style={{ background: m.color }} />
              <div className="p-6">
                <span className="inline-flex rounded-xl p-3 text-white" style={{ background: m.color }}>
                  <Icon size={22} />
                </span>
                <h2 className="mt-4 text-xl font-semibold">{m.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{m.blurb}</p>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                  {stats[s].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-slate-500">{k}</dt>
                      <dd className="text-lg font-semibold tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Open {m.label} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
