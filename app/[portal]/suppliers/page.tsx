"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Phone, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Section, Supplier } from "@/lib/types";
import { Badge, Card, Modal, NoAccess, PageHeader, StatCard, Table } from "@/components/ui";
import { BarChartBox } from "@/components/charts";
import { Stars } from "@/components/PurchaseOrderParts";
import { SupplierForm } from "@/components/SupplierForm";
import { supplierStats } from "@/lib/perf";
import { SECTION_META, fmtMoney, uid } from "@/lib/utils";

export default function Suppliers() {
  const { data, user, update } = useStore();
  const [q, setQ] = useState("");
  const [sec, setSec] = useState<Section | "all">("all");
  const [adding, setAdding] = useState<Supplier | null>(null);

  const rows = useMemo(
    () =>
      data.suppliers
        .filter(
          (s) =>
            (sec === "all" || s.sections.includes(sec)) &&
            (s.name + s.contactPerson).toLowerCase().includes(q.toLowerCase()),
        )
        .map((s) => ({ s, st: supplierStats(data, s.id) }))
        .sort((a, b) => b.st.owed - a.st.owed),
    [data, q, sec],
  );
  if (user!.role !== "admin") return <NoAccess />;

  const totalOwed = rows.reduce((a, r) => a + r.st.owed, 0);
  const owedChart = rows
    .filter((r) => r.st.owed > 0)
    .slice(0, 8)
    .map((r) => ({ name: r.s.name, owed: r.st.owed }));
  const rated = rows.filter((r) => r.st.onTimePct !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        subtitle="Contacts, delivery performance, price history and money owed."
        actions={
          <button
            className="btn-primary"
            onClick={() =>
              setAdding({
                id: uid(),
                name: "",
                contactPerson: "",
                phone: "",
                email: "",
                address: "",
                gstin: "",
                sections: ["grocery"],
                paymentTermsDays: 30,
                notes: "",
              })
            }
          >
            <Plus size={16} /> Add supplier
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Suppliers" value={data.suppliers.length} />
        <StatCard label="Total owed" value={fmtMoney(totalOwed)} tone={totalOwed ? "warn" : "good"} />
        <StatCard
          label="Avg on-time delivery"
          value={
            rated.length
              ? `${Math.round(rated.reduce((a, r) => a + (r.st.onTimePct ?? 0), 0) / rated.length)}%`
              : "—"
          }
        />
        <StatCard label="Open POs" value={rows.reduce((a, r) => a + r.st.open, 0)} />
      </div>

      {owedChart.length > 0 && (
        <Card title="Money owed by supplier" subtitle="Unpaid purchase bills">
          <BarChartBox
            data={owedChart}
            xKey="name"
            horizontal
            money
            height={Math.max(160, owedChart.length * 36)}
            series={[{ key: "owed", label: "Owed", color: "#eb6834" }]}
          />
        </Card>
      )}

      <div className="no-print flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search supplier or contact…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-auto"
          value={sec}
          onChange={(e) => setSec(e.target.value as Section | "all")}
        >
          <option value="all">All sections</option>
          {(Object.keys(SECTION_META) as Section[]).map((s) => (
            <option key={s} value={s}>
              {SECTION_META[s].label}
            </option>
          ))}
        </select>
      </div>

      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Supplier</th>
            <th className="th">Contact</th>
            <th className="th">Supplies</th>
            <th className="th">Rating</th>
            <th className="th text-right">On time</th>
            <th className="th text-right">Open POs</th>
            <th className="th text-right">Owed</th>
          </tr>
        }
      >
        {rows.map(({ s, st }) => (
          <tr key={s.id} className="hover:bg-slate-50">
            <td className="td">
              <Link href={`/admin/suppliers/${s.id}`} className="font-medium text-slate-900 hover:underline">
                {s.name}
              </Link>
              <p className="text-xs text-slate-500">{s.address}</p>
            </td>
            <td className="td">
              <p>{s.contactPerson}</p>
              <a
                href={`tel:${s.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <Phone size={11} /> {s.phone}
              </a>
            </td>
            <td className="td">
              <div className="flex flex-wrap gap-1">
                {s.sections.map((x) => (
                  <span key={x} className="badge bg-slate-100 text-slate-700">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: SECTION_META[x].color }}
                    />
                    {SECTION_META[x].label}
                  </span>
                ))}
              </div>
            </td>
            <td className="td">
              {st.rating ? (
                <Stars value={st.rating} size={14} />
              ) : (
                <span className="text-xs text-slate-400">No deliveries yet</span>
              )}
            </td>
            <td className="td text-right tabular-nums">
              {st.onTimePct === null ? (
                "—"
              ) : (
                <Badge tone={st.onTimePct >= 80 ? "good" : st.onTimePct >= 60 ? "warn" : "danger"}>
                  {st.onTimePct}%
                </Badge>
              )}
            </td>
            <td className="td text-right tabular-nums">{st.open}</td>
            <td className="td text-right font-medium tabular-nums">{st.owed ? fmtMoney(st.owed) : "—"}</td>
          </tr>
        ))}
      </Table>

      <Modal open={!!adding} onClose={() => setAdding(null)} title="Add supplier">
        {adding && (
          <SupplierForm
            initial={adding}
            onSave={(s) => {
              update((d) => {
                d.suppliers.push(s);
              });
              setAdding(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
