"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Card, Modal, NoAccess, PageHeader, StatCard, Table } from "@/components/ui";
import { LineChartBox } from "@/components/charts";
import { POStatusBadge, Stars } from "@/components/PurchaseOrderParts";
import { SupplierForm } from "@/components/SupplierForm";
import { poValue, supplierStats } from "@/lib/perf";
import { SECTION_META, addDays, daysUntil, fmtDate, fmtMoney } from "@/lib/utils";

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, user, update } = useStore();
  const [editing, setEditing] = useState(false);
  const sup = data.suppliers.find((s) => s.id === id);
  const st = useMemo(() => (sup ? supplierStats(data, sup.id) : null), [data, sup]);

  const priceItems = useMemo(() => {
    if (!sup || !st) return [] as { name: string; points: { date: string; price: number }[] }[];
    const map = new Map<string, { date: string; price: number }[]>();
    for (const p of st.pos.filter((p) => p.status !== "cancelled"))
      for (const l of p.lines)
        map.set(l.name, [...(map.get(l.name) ?? []), { date: p.createdOn, price: l.unitPrice }]);
    for (const i of st.importsCost)
      map.set(i.product, [...(map.get(i.product) ?? []), { date: i.arrivalDate, price: i.costPerKg }]);
    return [...map.entries()]
      .map(([name, points]) => ({ name, points: points.sort((a, b) => a.date.localeCompare(b.date)) }))
      .sort((a, b) => b.points.length - a.points.length);
  }, [sup, st]);
  const [item, setItem] = useState<string>("");

  if (user!.role !== "admin") return <NoAccess />;
  if (!sup || !st) return <p className="text-sm text-slate-500">Supplier not found.</p>;

  const chosen = priceItems.find((p) => p.name === (item || priceItems[0]?.name));
  const chartData = (chosen?.points ?? []).map((p) => ({ date: fmtDate(p.date), price: p.price }));
  const change =
    chosen && chosen.points.length > 1
      ? Math.round(
          ((chosen.points[chosen.points.length - 1].price - chosen.points[0].price) /
            chosen.points[0].price) *
            100,
        )
      : null;
  const unpaid = st.bills.filter((b) => !b.paid);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/suppliers"
        className="no-print inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} /> All suppliers
      </Link>
      <PageHeader
        title={sup.name}
        subtitle={sup.sections.map((s) => SECTION_META[s].label).join(" · ")}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Edit
            </button>
            <Link href="/admin/purchase-orders" className="btn-primary">
              <Plus size={16} /> New PO
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Contact">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Contact person</dt>
              <dd className="font-medium">{sup.contactPerson || "—"}</dd>
            </div>
            <a
              href={`tel:${sup.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Phone size={14} className="text-slate-400" /> {sup.phone}
            </a>
            <a href={`mailto:${sup.email}`} className="flex items-center gap-2 hover:underline">
              <Mail size={14} className="text-slate-400" /> {sup.email}
            </a>
            <p className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" /> {sup.address}
            </p>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <div>
                <dt className="text-xs text-slate-500">GSTIN</dt>
                <dd className="font-mono text-xs">{sup.gstin}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Payment terms</dt>
                <dd>{sup.paymentTermsDays} days</dd>
              </div>
            </div>
            {sup.notes && <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{sup.notes}</p>}
          </dl>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            label="Money owed"
            value={fmtMoney(st.owed)}
            tone={st.owed ? "warn" : "good"}
            hint={`${unpaid.length} unpaid bills`}
          />
          <StatCard label="Total purchased" value={fmtMoney(st.purchased)} />
          <StatCard
            label="On-time deliveries"
            value={st.onTimePct === null ? "—" : `${st.onTimePct}%`}
            tone={st.onTimePct === null ? "default" : st.onTimePct >= 80 ? "good" : "warn"}
            hint={`${st.pos.filter((p) => p.receivedOn).length} deliveries received`}
          />
          <StatCard
            label="Delivery rating"
            value={st.rating ? st.rating.toFixed(1) + " / 5" : "—"}
            hint={st.rating ? <Stars value={st.rating} size={12} /> : "Rated when goods arrive"}
          />
        </div>
      </div>

      {priceItems.length > 0 && (
        <Card
          title="Price history"
          subtitle={
            change !== null
              ? `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% since first order`
              : "Price paid per unit"
          }
          action={
            <select
              className="input w-auto py-1 text-xs"
              value={chosen?.name ?? ""}
              onChange={(e) => setItem(e.target.value)}
            >
              {priceItems.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.points.length})
                </option>
              ))}
            </select>
          }
        >
          <LineChartBox
            data={chartData}
            xKey="date"
            money
            height={240}
            series={[{ key: "price", label: "Unit price", color: "#2a78d6" }]}
          />
        </Card>
      )}

      <Card title="Unpaid bills" subtitle={`Due within ${sup.paymentTermsDays} days of the bill date`}>
        {unpaid.length === 0 ? (
          <p className="text-sm text-slate-500">All bills are paid.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {unpaid.map((b) => {
              const due = addDays(new Date(b.date + "T00:00:00"), sup.paymentTermsDays)
                .toISOString()
                .slice(0, 10);
              const left = daysUntil(due);
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    {b.description}
                    <span className="block text-xs text-slate-500">Billed {fmtDate(b.date)}</span>
                  </span>
                  <Badge tone={left < 0 ? "danger" : left <= 7 ? "warn" : "muted"}>
                    {left < 0 ? `${-left}d overdue` : `due in ${left}d`}
                  </Badge>
                  <span className="w-24 text-right font-medium tabular-nums">{fmtMoney(b.amount)}</span>
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() =>
                      update((d) => {
                        d.transactions.find((t) => t.id === b.id)!.paid = true;
                      })
                    }
                  >
                    Mark paid
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {st.pos.length > 0 && (
        <Table
          head={
            <tr>
              <th className="th">PO</th>
              <th className="th">Created</th>
              <th className="th">Expected</th>
              <th className="th">Received</th>
              <th className="th text-right">Value</th>
              <th className="th">Status</th>
              <th className="th">Rating</th>
            </tr>
          }
        >
          {st.pos.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="td font-medium text-slate-900">{p.poNo}</td>
              <td className="td">{fmtDate(p.createdOn)}</td>
              <td className="td">{fmtDate(p.expectedOn)}</td>
              <td className="td">
                {p.receivedOn ? (
                  <span className={p.receivedOn > p.expectedOn ? "text-amber-700" : ""}>
                    {fmtDate(p.receivedOn)}
                    {p.receivedOn > p.expectedOn && " (late)"}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="td text-right tabular-nums">{fmtMoney(poValue(p))}</td>
              <td className="td">
                <POStatusBadge po={p} />
              </td>
              <td className="td">{p.rating ? <Stars value={p.rating} size={12} /> : "—"}</td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit supplier">
        <SupplierForm
          initial={sup}
          onSave={(s) => {
            update((d) => {
              const old = d.suppliers.find((x) => x.id === s.id)!;
              // rename everywhere
              if (old.name !== s.name) {
                d.grocery.forEach((g) => g.supplier === old.name && (g.supplier = s.name));
                d.bright.forEach((b) => b.supplierName === old.name && (b.supplierName = s.name));
                d.imports.forEach((i) => i.supplier === old.name && (i.supplier = s.name));
                d.transactions.forEach((t) => t.party === old.name && (t.party = s.name));
              }
              Object.assign(old, s);
            });
            setEditing(false);
          }}
        />
      </Modal>
    </div>
  );
}
