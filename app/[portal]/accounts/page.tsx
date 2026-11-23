"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Transaction, TxnType } from "@/lib/types";
import {
  Badge,
  Card,
  Field,
  Modal,
  NoAccess,
  PageHeader,
  StatCard,
  TabButtons,
  Table,
} from "@/components/ui";
import { AreaChartBox, BarChartBox } from "@/components/charts";
import { monthlyTxn } from "@/lib/analytics";
import { SECTION_META, fmtDate, fmtMoney, isoDate, today, uid } from "@/lib/utils";

export default function Accounts() {
  const { data, user, update } = useStore();
  const [view, setView] = useState<"ledger" | "receivable" | "payable">("ledger");
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const monthly = useMemo(
    () => monthlyTxn(data.transactions, 12).map((m) => ({ ...m, profit: m.selling - m.buying - m.expense })),
    [data.transactions],
  );

  if (user!.role !== "admin") return <NoAccess />;

  const t = data.transactions;
  const income = t.filter((x) => x.type === "selling").reduce((s, x) => s + x.amount, 0);
  const spend = t.filter((x) => x.type !== "selling").reduce((s, x) => s + x.amount, 0);
  const receivable = t.filter((x) => x.type === "selling" && !x.paid);
  const payable = t.filter((x) => x.type !== "selling" && !x.paid);
  const sum = (xs: Transaction[]) => xs.reduce((s, x) => s + x.amount, 0);

  let balance = 0;
  const flow = monthly.map((m) => {
    balance += m.profit;
    return { month: m.month, balance };
  });

  const rows = (view === "ledger" ? t : view === "receivable" ? receivable : payable).filter((x) =>
    (x.description + x.party).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        subtitle={`${data.settings.firmName} · Owner: ${data.settings.ownerName}`}
        actions={
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> New entry
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total income" value={fmtMoney(income)} tone="good" />
        <StatCard label="Total spend" value={fmtMoney(spend)} hint="Purchases + expenses" />
        <StatCard
          label="Net profit"
          value={fmtMoney(income - spend)}
          tone={income - spend >= 0 ? "good" : "danger"}
        />
        <StatCard
          label="To receive"
          value={fmtMoney(sum(receivable))}
          hint={`${receivable.length} invoices`}
          tone="warn"
        />
        <StatCard
          label="To pay"
          value={fmtMoney(sum(payable))}
          hint={`${payable.length} bills`}
          tone="warn"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Monthly profit" subtitle="Selling − buying − expenses, last 12 months">
          <BarChartBox
            data={monthly}
            xKey="month"
            money
            series={[{ key: "profit", label: "Profit", color: "#2a78d6" }]}
          />
        </Card>
        <Card title="Cumulative cash position" subtitle="Running total of monthly profit">
          <AreaChartBox
            data={flow}
            xKey="month"
            money
            series={[{ key: "balance", label: "Balance", color: "#1baf7a" }]}
          />
        </Card>
      </div>
      <Card title="Income vs spend" subtitle="Last 12 months">
        <BarChartBox
          data={monthly}
          xKey="month"
          money
          series={[
            { key: "selling", label: "Income", color: "#2a78d6" },
            { key: "buying", label: "Purchases", color: "#eb6834" },
            { key: "expense", label: "Expenses", color: "#1baf7a" },
          ]}
        />
      </Card>

      <div className="no-print flex flex-wrap items-center gap-3">
        <TabButtons
          active={view}
          onChange={setView}
          tabs={[
            { id: "ledger", label: "Ledger" },
            { id: "receivable", label: "Receivables", count: receivable.length },
            { id: "payable", label: "Payables", count: payable.length },
          ]}
        />
        <input
          className="input max-w-xs"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Table
        empty={!rows.length}
        head={
          <tr>
            <th className="th">Date</th>
            <th className="th">Type</th>
            <th className="th">Section</th>
            <th className="th">Description</th>
            <th className="th">Party</th>
            <th className="th text-right">Debit</th>
            <th className="th text-right">Credit</th>
            <th className="th">Status</th>
          </tr>
        }
      >
        {rows.slice(0, 150).map((x) => (
          <tr key={x.id} className="hover:bg-slate-50">
            <td className="td">{fmtDate(x.date)}</td>
            <td className="td capitalize">{x.type}</td>
            <td className="td">{x.section === "general" ? "General" : SECTION_META[x.section].label}</td>
            <td className="td">{x.description}</td>
            <td className="td">{x.party}</td>
            <td className="td text-right tabular-nums">{x.type !== "selling" ? fmtMoney(x.amount) : ""}</td>
            <td className="td text-right tabular-nums text-emerald-700">
              {x.type === "selling" ? fmtMoney(x.amount) : ""}
            </td>
            <td className="td">
              {x.paid ? (
                <Badge tone="good">{x.type === "selling" ? "Received" : "Paid"}</Badge>
              ) : (
                <button
                  className="btn-ghost px-2 py-0.5 text-xs"
                  onClick={() =>
                    update((d) => {
                      d.transactions.find((y) => y.id === x.id)!.paid = true;
                    })
                  }
                >
                  Mark {x.type === "selling" ? "received" : "paid"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={adding} onClose={() => setAdding(false)} title="New account entry">
        <EntryForm
          onSave={(e) => {
            update((d) => {
              d.transactions.unshift(e);
              d.transactions.sort((a, b) => b.date.localeCompare(a.date));
            });
            setAdding(false);
          }}
        />
      </Modal>
    </div>
  );
}

function EntryForm({ onSave }: { onSave: (t: Transaction) => void }) {
  const [f, setF] = useState<Transaction>({
    id: uid(),
    date: isoDate(today()),
    type: "expense",
    section: "general",
    description: "",
    party: "",
    amount: 0,
    paid: true,
    archived: false,
  });
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <Field label="Type">
        <select
          className="input"
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value as TxnType })}
        >
          <option value="selling">Selling (income)</option>
          <option value="buying">Buying (purchase)</option>
          <option value="expense">Expense</option>
        </select>
      </Field>
      <Field label="Section">
        <select
          className="input"
          value={f.section}
          onChange={(e) => setF({ ...f, section: e.target.value as Transaction["section"] })}
        >
          <option value="general">General</option>
          <option value="grocery">Grocery</option>
          <option value="bright-idea">Bright Idea</option>
          <option value="raw-material">Raw Material</option>
        </select>
      </Field>
      <div className="col-span-2">
        <Field label="Description">
          <input
            className="input"
            required
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Party">
        <input className="input" value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} />
      </Field>
      <Field label="Amount (₹)">
        <input
          className="input"
          type="number"
          min={0}
          required
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
        />
      </Field>
      <Field label="Date">
        <input
          className="input"
          type="date"
          value={f.date}
          onChange={(e) => setF({ ...f, date: e.target.value })}
        />
      </Field>
      <label className="mt-6 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })} />
        Already paid / received
      </label>
      <div className="col-span-2 flex justify-end">
        <button className="btn-primary">Save entry</button>
      </div>
    </form>
  );
}
