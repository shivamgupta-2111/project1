"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, StatCard } from "@/components/ui";
import { BarChartBox, LineChartBox } from "@/components/charts";
import { repStats } from "@/lib/perf";
import { fmtMoney } from "@/lib/utils";

export function Progress({
  value,
  target,
  label,
  money,
}: {
  value: number;
  target: number;
  label: string;
  money?: boolean;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const tone = pct >= 100 ? "bg-emerald-600" : pct >= 60 ? "bg-ink-700" : "bg-amber-500";
  const fmt = (n: number) => (money ? fmtMoney(n) : String(n));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums">
          <b className="font-semibold text-slate-900">{fmt(value)}</b>
          <span className="text-slate-500"> / {target ? fmt(target) : "no target"}</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-2.5 rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-2.5 rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-slate-500">
        {target ? `${pct}%${pct >= 100 ? " — target hit 🎉" : ""}` : ""}
      </p>
    </div>
  );
}

export default function PerformanceView({ name }: { name: string }) {
  const { data } = useStore();
  const u = data.users.find((x) => x.name === name);
  const st = useMemo(() => repStats(data, name), [data, name]);
  if (!u) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Targets">
          <div className="space-y-4">
            <Progress label="Sales this month" value={st.salesMonth} target={u.monthlySalesTarget} money />
            <Progress label="Tasks done this week" value={st.tasksWeek} target={u.weeklyTaskTarget} />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Sales this week" value={fmtMoney(st.salesWeek)} />
          <StatCard label="Stock movements this week" value={st.activityWeek} />
          <StatCard
            label="Count accuracy"
            value={st.accuracy === null ? "—" : `${st.accuracy}%`}
            hint={`${st.counts} stock counts`}
            tone={st.accuracy !== null && st.accuracy < 80 ? "warn" : "default"}
          />
          <StatCard
            label="Flags / rejected requests"
            value={`${st.flags} / ${st.rejectedRequests}`}
            tone={st.flags ? "warn" : "good"}
            hint={`${st.pendingRequests} requests waiting`}
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Last 7 days" subtitle="Sales recorded per day">
          <BarChartBox
            data={st.daily}
            xKey="day"
            money
            height={220}
            series={[{ key: "sales", label: "Sales", color: "#2a78d6" }]}
          />
        </Card>
        <Card title="Tasks completed" subtitle="Per week, last 8 weeks">
          <LineChartBox
            data={st.weekly}
            xKey="week"
            height={220}
            series={[{ key: "tasks", label: "Tasks", color: "#1baf7a" }]}
          />
        </Card>
      </div>
    </div>
  );
}
