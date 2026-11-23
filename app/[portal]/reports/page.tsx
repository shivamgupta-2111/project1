"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Download, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Section, Transaction } from "@/lib/types";
import { Badge, Card, PageHeader, StatCard, TabButtons, Table } from "@/components/ui";
import { BarChartBox } from "@/components/charts";
import {
  SECTION_META,
  addDays,
  downloadCsv,
  fmtDate,
  fmtMoney,
  isoDate,
  lastNMonths,
  today,
} from "@/lib/utils";

type Tab = "buying" | "selling" | "archives";
const RANGES = [
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" },
  { id: "180", label: "Last 6 months" },
  { id: "all", label: "All time" },
];

const sectionLabel = (s: Transaction["section"]) => (s === "general" ? "General" : SECTION_META[s].label);

export default function Reports() {
  const { data, user, update } = useStore();
  const isAdmin = user!.role === "admin";
  const [tab, setTab] = useState<Tab>("selling");
  const [range, setRange] = useState("90");
  const [section, setSection] = useState<Section | "all">("all");

  const allowed = new Set<string>([...user!.sections, ...(isAdmin ? ["general"] : [])]);
  const from = range === "all" ? "0000" : isoDate(addDays(today(), -Number(range)));

  const rows = useMemo(
    () =>
      data.transactions.filter((t) => {
        if (!allowed.has(t.section)) return false;
        if (section !== "all" && t.section !== section) return false;
        if (tab === "archives") return t.archived;
        if (t.archived) return false;
        return t.type === tab && t.date >= from;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.transactions, tab, from, section, user],
  );

  const total = rows.reduce((s, t) => s + t.amount, 0);
  const unpaid = rows.filter((t) => !t.paid).reduce((s, t) => s + t.amount, 0);

  const months = lastNMonths(range === "30" ? 2 : range === "90" ? 3 : 6);
  const chart = months.map(({ key, label }) => {
    const r: Record<string, string | number> = { month: label };
    for (const s of ["grocery", "bright-idea", "raw-material"] as const) {
      r[s] = rows.filter((t) => t.section === s && t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0);
    }
    return r;
  });
  const sectionsShown = (["grocery", "bright-idea", "raw-material"] as const).filter(
    (s) => user!.sections.includes(s) && (section === "all" || section === s),
  );

  const topParties = Object.entries(
    rows.reduce<Record<string, number>>((m, t) => ((m[t.party] = (m[t.party] ?? 0) + t.amount), m), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([party, amount]) => ({ party, amount }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Buying, selling and archived records"
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={() =>
                downloadCsv(
                  `report-${tab}.csv`,
                  rows.map((t) => ({
                    Date: t.date,
                    Type: t.type,
                    Section: sectionLabel(t.section),
                    Description: t.description,
                    Party: t.party,
                    Amount: t.amount,
                    Paid: t.paid ? "Yes" : "No",
                  })),
                )
              }
            >
              <Download size={16} /> CSV
            </button>
            <button className="btn-ghost" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </button>
          </>
        }
      />

      <div className="no-print flex flex-wrap items-center gap-3">
        <TabButtons
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "buying", label: "Buying" },
            { id: "selling", label: "Selling" },
            { id: "archives", label: "Archives" },
          ]}
        />
        {tab !== "archives" && (
          <select className="input w-auto" value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        )}
        <select
          className="input w-auto"
          value={section}
          onChange={(e) => setSection(e.target.value as Section | "all")}
        >
          <option value="all">All sections</option>
          {user!.sections.map((s) => (
            <option key={s} value={s}>
              {SECTION_META[s].label}
            </option>
          ))}
        </select>
        {tab === "archives" && isAdmin && (
          <button
            className="btn-ghost ml-auto"
            onClick={() => {
              const cutoff = isoDate(addDays(today(), -90));
              const n = data.transactions.filter((t) => !t.archived && t.date < cutoff && t.paid).length;
              if (!confirm(`Archive ${n} paid records older than 90 days?`)) return;
              update((d) => {
                for (const t of d.transactions)
                  if (!t.archived && t.date < cutoff && t.paid) t.archived = true;
              });
            }}
          >
            <Archive size={16} /> Archive paid records older than 90 days
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={tab === "archives" ? "Archived value" : `Total ${tab}`} value={fmtMoney(total)} />
        <StatCard label="Records" value={rows.length} />
        <StatCard
          label={tab === "selling" ? "To receive" : "Unpaid"}
          value={fmtMoney(unpaid)}
          tone={unpaid ? "warn" : "good"}
        />
        <StatCard label="Average per record" value={fmtMoney(rows.length ? total / rows.length : 0)} />
      </div>

      {tab !== "archives" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card
              title={`${tab === "buying" ? "Buying" : "Selling"} by month`}
              subtitle="Stacked by warehouse section"
            >
              <BarChartBox
                data={chart}
                xKey="month"
                money
                stacked
                series={sectionsShown.map((s) => ({
                  key: s,
                  label: SECTION_META[s].label,
                  color: SECTION_META[s].color,
                }))}
              />
            </Card>
          </div>
          <Card title={tab === "buying" ? "Top suppliers" : "Top customers"}>
            <ul className="space-y-3">
              {topParties.map((p) => (
                <li key={p.party}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate text-slate-700">{p.party}</span>
                    <span className="font-medium tabular-nums">{fmtMoney(p.amount)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-ink-700"
                      style={{ width: `${(p.amount / (topParties[0]?.amount || 1)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Date</th>
            {tab === "archives" && <th className="th">Type</th>}
            <th className="th">Section</th>
            <th className="th">Description</th>
            <th className="th">Party</th>
            <th className="th text-right">Amount</th>
            <th className="th">Payment</th>
            {isAdmin && <th className="th no-print" />}
          </tr>
        }
      >
        {rows.slice(0, 200).map((t) => (
          <tr key={t.id} className="hover:bg-slate-50">
            <td className="td">{fmtDate(t.date)}</td>
            {tab === "archives" && <td className="td capitalize">{t.type}</td>}
            <td className="td">{sectionLabel(t.section)}</td>
            <td className="td">{t.description}</td>
            <td className="td">{t.party}</td>
            <td className="td text-right font-medium tabular-nums">{fmtMoney(t.amount)}</td>
            <td className="td">
              {t.paid ? <Badge tone="good">Paid</Badge> : <Badge tone="warn">Pending</Badge>}
            </td>
            {isAdmin && (
              <td className="td no-print text-right">
                <button
                  title={t.archived ? "Restore" : "Archive"}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                  onClick={() =>
                    update((d) => {
                      const x = d.transactions.find((y) => y.id === t.id)!;
                      x.archived = !x.archived;
                    })
                  }
                >
                  {t.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                </button>
              </td>
            )}
          </tr>
        ))}
      </Table>
      {rows.length > 200 && (
        <p className="text-center text-xs text-slate-500">
          Showing 200 of {rows.length}. Download CSV for the full list.
        </p>
      )}
    </div>
  );
}
