"use client";

import { useMemo, useState } from "react";
import { Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Card, Field, Modal, PageHeader, Table } from "@/components/ui";
import { BarChartBox } from "@/components/charts";
import PerformanceView, { Progress } from "@/components/PerformanceView";
import { repStats } from "@/lib/perf";
import { fmtMoney } from "@/lib/utils";

export default function PerformancePage() {
  const { data, user, update } = useStore();
  const isAdmin = user!.role === "admin";
  const reps = data.users.filter((u) => u.role === "rep");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; sales: number; tasks: number } | null>(null);
  const stats = useMemo(() => reps.map((u) => ({ u, st: repStats(data, u.name) })), [data, reps]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="My performance" subtitle="Your sales, tasks and stock work this week and month." />
        <PerformanceView name={user!.name} />
      </div>
    );
  }

  const chart = stats.map(({ u, st }) => ({
    rep: u.name.split(" ")[0],
    sales: st.salesMonth,
    target: u.monthlySalesTarget,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rep performance"
        subtitle="Sales, tasks, activity and flags for each rep, against their targets."
      />

      <Card title="Sales this month vs target">
        <BarChartBox
          data={chart}
          xKey="rep"
          money
          height={240}
          series={[
            { key: "sales", label: "Sales", color: "#2a78d6" },
            { key: "target", label: "Target", color: "#eb6834" },
          ]}
        />
      </Card>

      <Table
        head={
          <tr>
            <th className="th">Rep</th>
            <th className="th w-56">Sales this month</th>
            <th className="th w-48">Tasks this week</th>
            <th className="th text-right">Moves (week)</th>
            <th className="th text-right">Count accuracy</th>
            <th className="th text-right">Flags</th>
            <th className="th text-right">Rejected</th>
            <th className="th" />
          </tr>
        }
      >
        {stats.map(({ u, st }) => (
          <tr
            key={u.id}
            className={`cursor-pointer hover:bg-slate-50 ${selected === u.name ? "bg-slate-50" : ""}`}
            onClick={() => setSelected(u.name)}
          >
            <td className="td">
              <p className="font-medium text-slate-900">{u.name}</p>
              {!u.active && <Badge tone="muted">disabled</Badge>}
            </td>
            <td className="td">
              <Progress label="" value={st.salesMonth} target={u.monthlySalesTarget} money />
            </td>
            <td className="td">
              <Progress label="" value={st.tasksWeek} target={u.weeklyTaskTarget} />
            </td>
            <td className="td text-right tabular-nums">{st.activityWeek}</td>
            <td className="td text-right tabular-nums">{st.accuracy === null ? "—" : `${st.accuracy}%`}</td>
            <td className="td text-right">{st.flags ? <Badge tone="danger">{st.flags}</Badge> : "0"}</td>
            <td className="td text-right tabular-nums">{st.rejectedRequests}</td>
            <td className="td text-right" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn-ghost px-2.5 py-1 text-xs"
                onClick={() =>
                  setEditing({ id: u.id, sales: u.monthlySalesTarget, tasks: u.weeklyTaskTarget })
                }
              >
                <Target size={14} /> Targets
              </button>
            </td>
          </tr>
        ))}
      </Table>

      {selected && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">{selected}</h2>
          <PerformanceView name={selected} />
        </div>
      )}
      {!selected && <p className="text-center text-sm text-slate-500">Click a rep to see their detail.</p>}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Set targets">
        {editing && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              update((d) => {
                const u = d.users.find((x) => x.id === editing.id)!;
                u.monthlySalesTarget = editing.sales;
                u.weeklyTaskTarget = editing.tasks;
              });
              setEditing(null);
            }}
          >
            <Field label="Monthly sales target (₹)">
              <input
                className="input"
                type="number"
                min={0}
                value={editing.sales}
                onChange={(e) => setEditing({ ...editing, sales: Number(e.target.value) })}
              />
            </Field>
            <p className="-mt-2 text-xs text-slate-500">{fmtMoney(editing.sales)}</p>
            <Field label="Weekly task target">
              <input
                className="input"
                type="number"
                min={0}
                value={editing.tasks}
                onChange={(e) => setEditing({ ...editing, tasks: Number(e.target.value) })}
              />
            </Field>
            <div className="flex justify-end">
              <button className="btn-primary">Save targets</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
