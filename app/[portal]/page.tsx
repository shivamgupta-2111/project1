"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  IndianRupee,
  MessageSquareText,
  PenLine,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
} from "lucide-react";
import MyRequests from "@/components/MyRequests";
import { Progress } from "@/components/PerformanceView";
import { poOverdue, poValue, repStats } from "@/lib/perf";
import { useStore } from "@/lib/store";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { AreaChartBox, BarChartBox, ShareBar } from "@/components/charts";
import { groceryByCategory, monthlyTxn, rawByCategory, stockValues } from "@/lib/analytics";
import { SECTION_META, daysUntil, fmtDateTime, fmtMoney, fmtNum, isLow, totalQty } from "@/lib/utils";
import { useAlerts } from "@/components/Shell";

export default function Dashboard() {
  const { data, user } = useStore();
  const alerts = useAlerts();
  const isAdmin = user!.role === "admin";
  const base = `/${user!.role}`;
  const can = (s: string) => user!.sections.includes(s as never);

  const monthly = useMemo(() => monthlyTxn(data.transactions, 6), [data.transactions]);
  const thisM = monthly[monthly.length - 1];
  const prevM = monthly[monthly.length - 2];
  const values = useMemo(() => stockValues(data), [data]);
  const groceryCats = useMemo(() => groceryByCategory(data), [data]);
  const rawCats = useMemo(() => rawByCategory(data), [data]);

  const low = data.grocery.filter(isLow);
  const expSoon = data.grocery.filter((g) => {
    const d = daysUntil(g.expiryDate);
    return d >= 0 && d <= data.settings.expiryWarningDays;
  });
  const expired = data.grocery.filter((g) => daysUntil(g.expiryDate) < 0);
  const susp = data.activity.filter((a) => a.suspicious && !a.reviewed);
  const openBacklog = data.backlog.filter((b) => b.status !== "done");
  const brightLow = data.bright.filter((b) => b.quantity < b.minQuantity);

  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
  const salesDelta = pct(thisM.selling, prevM.selling);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user!.name.split(" ")[0]}`}
        subtitle={
          isAdmin
            ? "Here's how the whole business is doing."
            : "Here's what needs your attention in your sections."
        }
      />

      {isAdmin ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Sales this month"
            value={fmtMoney(thisM.selling)}
            icon={<TrendingUp size={16} />}
            tone={salesDelta >= 0 ? "good" : "danger"}
            hint={`${salesDelta >= 0 ? "▲" : "▼"} ${Math.abs(salesDelta)}% vs last month`}
          />
          <StatCard
            label="Purchases this month"
            value={fmtMoney(thisM.buying)}
            icon={<IndianRupee size={16} />}
            hint={`Expenses ${fmtMoney(thisM.expense)}`}
          />
          <StatCard
            label="Total stock value"
            value={fmtMoney(values.total)}
            icon={<Boxes size={16} />}
            hint="At cost, all three sections"
          />
          <StatCard
            label="Open alerts"
            value={alerts.length}
            icon={<AlertTriangle size={16} />}
            tone={alerts.length ? "warn" : "good"}
            hint={`${susp.length} suspicious · ${low.length + brightLow.length} low stock`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Items to re-order"
            value={low.length + brightLow.length}
            icon={<ClipboardList size={16} />}
            tone="warn"
            hint="Grocery + Bright Idea"
          />
          <StatCard
            label="Expiring soon"
            value={expSoon.length}
            icon={<CalendarClock size={16} />}
            tone="warn"
            hint={`${expired.length} already expired`}
          />
          <StatCard
            label="Open backlog"
            value={openBacklog.length}
            icon={<ClipboardList size={16} />}
            hint={`${openBacklog.filter((b) => b.status === "delayed").length} delayed`}
          />
          <StatCard
            label="Raw stock arrivals (30d)"
            value={data.imports.filter((i) => daysUntil(i.arrivalDate) >= -30).length}
            icon={<ArrowDownToLine size={16} />}
            hint="Import entries in the last 30 days"
          />
        </div>
      )}

      {isAdmin ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              href: "approvals",
              icon: ShieldCheck,
              label: "Approvals waiting",
              value: data.approvals.filter((a) => a.status === "pending").length,
              hint: "Adjustments, write-offs, exports",
            },
            {
              href: "purchase-orders",
              icon: Truck,
              label: "Open purchase orders",
              value: data.purchaseOrders.filter((p) => p.status === "sent" || p.status === "partial").length,
              hint: `${data.purchaseOrders.filter(poOverdue).length} overdue · ${fmtMoney(data.purchaseOrders.filter((p) => p.status === "sent" || p.status === "partial").reduce((a, p) => a + poValue(p), 0))}`,
            },
            {
              href: "tasks",
              icon: CheckSquare,
              label: "Tasks done today",
              value: data.tasks.filter(
                (t) => t.done && (t.doneAt ?? "").slice(0, 10) === new Date().toISOString().slice(0, 10),
              ).length,
              hint: `${data.tasks.filter((t) => !t.done).length} still open`,
            },
            {
              href: "handover",
              icon: MessageSquareText,
              label: "Handover notes (24h)",
              value: data.handover.filter((n) => Date.now() - new Date(n.at).getTime() < 86_400_000).length,
              hint: `${data.handover.filter((n) => n.priority === "urgent" && !n.acknowledgedBy.includes(user!.name)).length} urgent unread`,
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={`${base}/${c.href}`}
              className="card flex items-start gap-3 p-4 transition hover:shadow-md"
            >
              <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <c.icon size={18} />
              </span>
              <span>
                <span className="block text-sm text-slate-500">{c.label}</span>
                <span className="block text-xl font-semibold tabular-nums">{c.value}</span>
                <span className="block text-xs text-slate-500">{c.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "scan", icon: ScanLine, label: "Scan" },
            { href: "quick", icon: PenLine, label: "Quick entry" },
            { href: "count", icon: ClipboardCheck, label: "Stock count" },
            { href: "handover", icon: MessageSquareText, label: "Handover note" },
          ].map((c) => (
            <Link
              key={c.href}
              href={`${base}/${c.href}`}
              className="card flex flex-col items-center gap-2 py-5 text-sm font-medium transition hover:shadow-md active:scale-[0.98]"
            >
              <c.icon size={26} className="text-slate-700" />
              {c.label}
            </Link>
          ))}
        </div>
      )}

      {!isAdmin && <RepToday />}

      {alerts.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {alerts.map((a) => (
            <Link
              key={a.text}
              href={`${base}/${a.href}`}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition hover:shadow-sm ${
                a.tone === "danger"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {a.tone === "danger" ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
              {a.text}
              <span className="ml-auto text-xs opacity-70">View →</span>
            </Link>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Buying vs selling" subtitle="Last 6 months, all sections">
              <AreaChartBox
                data={monthly}
                xKey="month"
                money
                series={[
                  { key: "selling", label: "Selling", color: "#2a78d6" },
                  { key: "buying", label: "Buying", color: "#eb6834" },
                ]}
              />
            </Card>
          </div>
          <Card title="Stock value by section" subtitle="At cost price">
            <ShareBar
              parts={[
                {
                  label: "Grocery",
                  value: values.grocery,
                  color: SECTION_META.grocery.color,
                  display: fmtMoney(values.grocery),
                },
                {
                  label: "Bright Idea",
                  value: values.bright,
                  color: SECTION_META["bright-idea"].color,
                  display: fmtMoney(values.bright),
                },
                {
                  label: "Raw Material",
                  value: values.raw,
                  color: SECTION_META["raw-material"].color,
                  display: fmtMoney(values.raw),
                },
              ]}
            />
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Net this month (sales − purchases − expenses)</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {fmtMoney(thisM.selling - thisM.buying - thisM.expense)}
              </p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {isAdmin && (
          <Card title="Sales by section" subtitle="Monthly selling, stacked">
            <BarChartBox
              data={monthly}
              xKey="month"
              money
              stacked
              series={[
                { key: "grocery", label: "Grocery", color: SECTION_META.grocery.color },
                { key: "bright", label: "Bright Idea", color: SECTION_META["bright-idea"].color },
                { key: "raw", label: "Raw Material", color: SECTION_META["raw-material"].color },
              ]}
            />
          </Card>
        )}
        {can("grocery") && (
          <Card title="Grocery stock by category" subtitle="Units in store room vs on shelf">
            <BarChartBox
              data={groceryCats}
              xKey="category"
              stacked
              series={[
                { key: "store", label: "Store room", color: "#2a78d6" },
                { key: "shelf", label: "On shelf", color: "#1baf7a" },
              ]}
            />
          </Card>
        )}
        {can("raw-material") && (
          <Card title="Raw material: imported vs exported" subtitle="Total kg by category">
            <BarChartBox
              data={rawCats}
              xKey="category"
              series={[
                { key: "imported", label: "Imported (kg)", color: "#2a78d6" },
                { key: "exported", label: "Exported (kg)", color: "#eb6834" },
              ]}
            />
          </Card>
        )}
        {!isAdmin && can("bright-idea") && (
          <Card title="Bright Idea – low quantity" subtitle="Below the minimum level">
            <ul className="divide-y divide-slate-100">
              {brightLow.slice(0, 8).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {b.productName} <span className="text-slate-400">· {b.region}</span>
                  </span>
                  <Badge tone="danger">
                    {b.quantity} / {b.minQuantity}
                  </Badge>
                </li>
              ))}
              {!brightLow.length && (
                <li className="py-4 text-sm text-slate-500">No low quantity products.</li>
              )}
            </ul>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {can("grocery") && (
          <Card
            title="Running low"
            subtitle="Grocery items at or below re-order level"
            action={
              <Link
                href={`${base}/warehouse/grocery/to-order`}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                To order →
              </Link>
            }
          >
            <ul className="divide-y divide-slate-100">
              {low.slice(0, 7).map((g) => (
                <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{g.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {totalQty(g)} left · reorder at {g.reorderLevel}
                  </span>
                </li>
              ))}
              {!low.length && <li className="py-4 text-sm text-slate-500">Everything is well stocked.</li>}
            </ul>
          </Card>
        )}
        <Card title="Recent activity" subtitle="Latest stock movements">
          <ul className="divide-y divide-slate-100">
            {data.activity.slice(0, 7).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                {a.delta >= 0 ? (
                  <ArrowDownToLine size={14} className="text-emerald-600" />
                ) : (
                  <ArrowUpFromLine size={14} className="text-slate-400" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{a.action}</span> · {a.itemName}
                  <span className="text-slate-400"> · {a.userName}</span>
                </span>
                {a.suspicious && <Badge tone="danger">Flagged</Badge>}
                <span
                  className={`w-12 text-right tabular-nums ${a.delta >= 0 ? "text-emerald-700" : "text-slate-600"}`}
                >
                  {a.delta > 0 ? "+" : ""}
                  {fmtNum(a.delta)}
                </span>
                <span className="hidden w-28 text-right text-xs text-slate-400 sm:block">
                  {fmtDateTime(a.at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function RepToday() {
  const { data, user } = useStore();
  const st = repStats(data, user!.name);
  const base = `/${user!.role}`;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="My week"
        action={
          <Link
            href={`${base}/performance`}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Details →
          </Link>
        }
      >
        <div className="space-y-4">
          <Progress label="Sales this month" value={st.salesMonth} target={user!.monthlySalesTarget} money />
          <Progress label="Tasks done this week" value={st.tasksWeek} target={user!.weeklyTaskTarget} />
          <Link href={`${base}/tasks`} className="btn-primary w-full">
            <CheckSquare size={16} /> {st.openTasks} assigned task{st.openTasks === 1 ? "" : "s"} open — go to
            my tasks
          </Link>
        </div>
      </Card>
      <MyRequests limit={4} />
    </div>
  );
}
