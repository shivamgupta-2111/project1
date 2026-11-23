"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BarChart3,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  PenLine,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wheat,
  X,
} from "lucide-react";
import { poOverdue } from "@/lib/perf";
import { useStore } from "@/lib/store";
import type { Section } from "@/lib/types";
import { SECTION_META, daysUntil, isLow } from "@/lib/utils";

const SECTION_ICON: Record<Section, React.ElementType> = {
  grocery: ShoppingBasket,
  "bright-idea": Lightbulb,
  "raw-material": Wheat,
};

const SECTION_LINKS: Record<Section, { label: string; href: string }[]> = {
  grocery: [
    { label: "Overview & graphs", href: "overview" },
    { label: "Inventory / stock items", href: "inventory" },
    { label: "Shelf items", href: "shelf" },
    { label: "Item expiry", href: "expiry" },
    { label: "To order", href: "to-order" },
    { label: "Backlog", href: "backlog" },
    { label: "Suspicious activity", href: "suspicious" },
  ],
  "bright-idea": [
    { label: "Products", href: "" },
    { label: "Low quantity alerts", href: "?filter=low" },
  ],
  "raw-material": [
    { label: "Overview & graphs", href: "overview" },
    { label: "Import (arrivals)", href: "import" },
    { label: "Export (shipments)", href: "export" },
  ],
};

export function useAlerts() {
  const { data, user } = useStore();
  return useMemo(() => {
    const warn = data.settings.expiryWarningDays;
    const allowed = new Set(user?.sections ?? []);
    const list: { text: string; href: string; tone: "danger" | "warn" }[] = [];
    if (allowed.has("grocery")) {
      const low = data.grocery.filter(isLow).length;
      const expired = data.grocery.filter((g) => daysUntil(g.expiryDate) < 0).length;
      const soon = data.grocery.filter((g) => {
        const d = daysUntil(g.expiryDate);
        return d >= 0 && d <= warn;
      }).length;
      const susp = data.activity.filter((a) => a.suspicious && !a.reviewed).length;
      if (expired)
        list.push({
          text: `${expired} grocery items have expired`,
          href: "warehouse/grocery/expiry",
          tone: "danger",
        });
      if (susp && user?.role === "admin")
        list.push({
          text: `${susp} suspicious activities to review`,
          href: "warehouse/grocery/suspicious",
          tone: "danger",
        });
      if (low)
        list.push({
          text: `${low} grocery items need re-ordering`,
          href: "warehouse/grocery/to-order",
          tone: "warn",
        });
      if (soon)
        list.push({
          text: `${soon} grocery items expire within ${warn} days`,
          href: "warehouse/grocery/expiry",
          tone: "warn",
        });
    }
    const me = user?.name ?? "";
    const urgentNotes = data.handover.filter(
      (n) => n.priority === "urgent" && n.author !== me && !n.acknowledgedBy.includes(me),
    ).length;
    if (urgentNotes)
      list.unshift({
        text: `${urgentNotes} urgent handover note${urgentNotes > 1 ? "s" : ""}`,
        href: "handover",
        tone: "danger",
      });
    if (user?.role === "admin") {
      const pend = data.approvals.filter((a) => a.status === "pending").length;
      if (pend)
        list.unshift({
          text: `${pend} request${pend > 1 ? "s" : ""} waiting for your approval`,
          href: "approvals",
          tone: "danger",
        });
      const late = data.purchaseOrders.filter(poOverdue).length;
      if (late)
        list.push({
          text: `${late} purchase order${late > 1 ? "s are" : " is"} overdue`,
          href: "purchase-orders",
          tone: "warn",
        });
    } else {
      const decided = data.approvals.filter((a) => a.requestedBy === me && !a.seenByRequester).length;
      if (decided)
        list.unshift({
          text: `${decided} of your requests ${decided > 1 ? "were" : "was"} decided`,
          href: "quick",
          tone: "warn",
        });
    }
    if (allowed.has("bright-idea")) {
      const low = data.bright.filter((b) => b.quantity < b.minQuantity).length;
      if (low)
        list.push({
          text: `${low} Bright Idea products are low in quantity`,
          href: "warehouse/bright-idea?filter=low",
          tone: "warn",
        });
    }
    return list;
  }, [data, user]);
}

function WarehouseFlyout({
  portal,
  sections,
  onNavigate,
}: {
  portal: string;
  sections: Section[];
  onNavigate: () => void;
}) {
  const { data } = useStore();
  const stat: Record<Section, string> = {
    grocery: `${data.grocery.length} items · ${data.grocery.filter(isLow).length} low`,
    "bright-idea": `${data.bright.length} products · ${data.bright.filter((b) => b.quantity < b.minQuantity).length} alerts`,
    "raw-material": `${data.imports.length} imports · ${data.exports.length} exports`,
  };
  return (
    <div className="w-[min(92vw,640px)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Warehouse</p>
        <Link
          href={`/${portal}/warehouse`}
          onClick={onNavigate}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          View all →
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {sections.map((s) => {
          const m = SECTION_META[s];
          const Icon = SECTION_ICON[s];
          const base = `/${portal}/warehouse/${m.href}`;
          return (
            <div
              key={s}
              className="group rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <Link href={base} onClick={onNavigate} className="block">
                <span className="mb-2 inline-flex rounded-lg p-2 text-white" style={{ background: m.color }}>
                  <Icon size={18} />
                </span>
                <p className="font-semibold">{m.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{stat[s]}</p>
              </Link>
              <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
                {SECTION_LINKS[s].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href.startsWith("?") || l.href === "" ? base + l.href : `${base}/${l.href}`}
                      onClick={onNavigate}
                      className="block rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Shell({ portal, children }: { portal: "admin" | "rep"; children: React.ReactNode }) {
  const { data, user, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flyout, setFlyout] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [flyTop, setFlyTop] = useState(120);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alerts = useAlerts();

  useEffect(() => {
    setMobileOpen(false);
    setFlyout(false);
    setBellOpen(false);
  }, [pathname]);

  if (!user) return null;
  const sections = user.sections;
  const isAdmin = user.role === "admin";
  const base = `/${portal}`;

  const pendingApprovals = data.approvals.filter((a) => a.status === "pending").length;
  const unreadNotes = data.handover.filter(
    (n) => n.author !== user.name && !n.acknowledgedBy.includes(user.name),
  ).length;
  const myOpenTasks = data.tasks.filter(
    (t) => !t.done && t.createdBy !== "System" && (t.assignedTo === user.name || t.assignedTo === null),
  ).length;

  type NavItem = { label: string; href: string; icon: React.ElementType; flyout?: boolean; badge?: number };
  const groups: { title?: string; items: NavItem[] }[] = isAdmin
    ? [
        {
          items: [
            { label: "Dashboard", href: base, icon: LayoutDashboard },
            { label: "Warehouse", href: `${base}/warehouse`, icon: Warehouse, flyout: true },
          ],
        },
        {
          title: "Operations",
          items: [
            { label: "Approvals", href: `${base}/approvals`, icon: ShieldCheck, badge: pendingApprovals },
            { label: "Purchase orders", href: `${base}/purchase-orders`, icon: ClipboardList },
            { label: "Suppliers", href: `${base}/suppliers`, icon: Truck },
            { label: "Stock counts", href: `${base}/count`, icon: ClipboardCheck },
            { label: "Scan & labels", href: `${base}/scan`, icon: ScanLine },
          ],
        },
        {
          title: "Team",
          items: [
            { label: "Rep performance", href: `${base}/performance`, icon: Gauge },
            { label: "Daily tasks", href: `${base}/tasks`, icon: CheckSquare },
            {
              label: "Shift handover",
              href: `${base}/handover`,
              icon: MessageSquareText,
              badge: unreadNotes,
            },
          ],
        },
        {
          title: "Finance & admin",
          items: [
            { label: "Reports", href: `${base}/reports`, icon: FileText },
            { label: "Accounts", href: `${base}/accounts`, icon: Wallet },
            { label: "Users & reps", href: `${base}/users`, icon: Users },
            { label: "Settings", href: `${base}/settings`, icon: Settings },
          ],
        },
      ]
    : [
        {
          items: [
            { label: "Dashboard", href: base, icon: LayoutDashboard },
            { label: "My tasks", href: `${base}/tasks`, icon: CheckSquare, badge: myOpenTasks },
          ],
        },
        {
          title: "On the floor",
          items: [
            { label: "Scan", href: `${base}/scan`, icon: ScanLine },
            { label: "Quick entry", href: `${base}/quick`, icon: PenLine },
            { label: "Stock count", href: `${base}/count`, icon: ClipboardCheck },
            { label: "Warehouse", href: `${base}/warehouse`, icon: Warehouse, flyout: true },
          ],
        },
        {
          title: "Me & team",
          items: [
            {
              label: "Shift handover",
              href: `${base}/handover`,
              icon: MessageSquareText,
              badge: unreadNotes,
            },
            { label: "My performance", href: `${base}/performance`, icon: Gauge },
            { label: "Reports", href: `${base}/reports`, icon: FileText },
          ],
        },
      ];

  // bottom tabs on mobile (reps only)
  const bottom: NavItem[] = [
    { label: "Tasks", href: `${base}/tasks`, icon: CheckSquare, badge: myOpenTasks },
    { label: "Scan", href: `${base}/scan`, icon: ScanLine },
    { label: "Entry", href: `${base}/quick`, icon: PenLine },
    { label: "Count", href: `${base}/count`, icon: ClipboardCheck },
  ];

  const open = () => {
    if (timer.current) clearTimeout(timer.current);
    setFlyout(true);
  };
  const close = () => {
    timer.current = setTimeout(() => setFlyout(false), 160);
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
          <BarChart3 size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.settings.firmName}</p>
          <p className="text-xs text-slate-400">{isAdmin ? "Admin portal" : "Rep portal"}</p>
        </div>
      </div>
      <div className="sidebar-scroll flex-1 space-y-3 overflow-y-auto pl-3 pr-2 pb-4">
        {groups.map((g, gi) => (
          <ul key={gi} className="space-y-0.5">
            {g.title && (
              <li className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {g.title}
              </li>
            )}
            {g.items.map((n) => {
              const active = n.href === base ? pathname === base : pathname.startsWith(n.href);
              const Icon = n.icon;
              const cls = `flex w-full items-center gap-3 rounded-lg px-3 py-[7px] text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 ${
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`;
              if (n.flyout) {
                return (
                  <li
                    key={n.label}
                    className="relative"
                    onMouseEnter={(e) => {
                      setFlyTop(
                        Math.min(e.currentTarget.getBoundingClientRect().top, window.innerHeight - 480),
                      );
                      open();
                    }}
                    onMouseLeave={close}
                  >
                    <button className={cls} onClick={() => setFlyout((v) => !v)} aria-expanded={flyout}>
                      <Icon size={18} />
                      {n.label}
                      <ChevronRight
                        size={16}
                        className={`ml-auto transition ${flyout ? "rotate-90 lg:rotate-0" : ""}`}
                      />
                    </button>
                    {flyout && (
                      <div
                        className="fixed left-64 z-50 hidden pl-3 lg:block"
                        style={{ top: flyTop }}
                        onMouseEnter={open}
                        onMouseLeave={close}
                      >
                        <WarehouseFlyout
                          portal={portal}
                          sections={sections}
                          onNavigate={() => setFlyout(false)}
                        />
                      </div>
                    )}
                    {flyout && (
                      <ul className="mt-1 space-y-1 pl-9 lg:hidden">
                        {sections.map((s) => (
                          <li key={s}>
                            <Link
                              href={`${base}/warehouse/${SECTION_META[s].href}`}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:text-white"
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: SECTION_META[s].color }}
                              />
                              {SECTION_META[s].label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }
              return (
                <li key={n.label}>
                  <Link href={n.href} className={cls}>
                    <Icon size={18} />
                    {n.label}
                    {!!n.badge && (
                      <span className="ml-auto rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                        {n.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs font-semibold">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-900 text-white lg:block">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink-900 text-white">
            <button
              className="absolute right-3 top-5 p-1 text-slate-300"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <p className="text-sm text-slate-500">
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="sm:hidden">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </p>
          <span
            className={`badge ml-2 ${isAdmin ? "bg-ink-900 text-white" : "bg-sky-50 text-sky-700 ring-1 ring-sky-200"}`}
          >
            {isAdmin ? "Admin" : "Rep"}
          </span>
          <div className="relative ml-auto">
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Alerts"
            >
              <Bell size={18} />
              {alerts.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {alerts.length}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Alerts
                </p>
                {alerts.length === 0 && <p className="px-2 py-3 text-sm text-slate-500">All clear 🎉</p>}
                {alerts.map((a) => (
                  <Link
                    key={a.text}
                    href={`${base}/${a.href}`}
                    className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.tone === "danger" ? "bg-red-600" : "bg-amber-500"}`}
                    />
                    <span className="text-slate-700">{a.text}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className={`mx-auto max-w-7xl p-4 lg:p-8 ${!isAdmin ? "pb-24 lg:pb-8" : ""}`}>{children}</main>
      </div>

      {!isAdmin && (
        <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          {bottom.map((b) => {
            const on = pathname.startsWith(b.href);
            return (
              <Link
                key={b.href}
                href={b.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? "text-slate-900" : "text-slate-500"}`}
              >
                <b.icon size={22} strokeWidth={on ? 2.4 : 1.8} />
                {b.label}
                {!!b.badge && <span className="absolute right-[22%] top-1 h-2 w-2 rounded-full bg-red-600" />}
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500"
          >
            <MoreHorizontal size={22} />
            More
          </button>
        </nav>
      )}
    </div>
  );
}
