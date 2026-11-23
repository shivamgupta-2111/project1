"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect } from "react";

export function PageHeader({
  title,
  subtitle,
  accent,
  actions,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          {accent && <span className="h-6 w-1.5 rounded-full" style={{ background: accent }} />}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const toneCls = {
    default: "bg-slate-100 text-slate-600",
    warn: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    good: "bg-emerald-50 text-emerald-700",
  }[tone];
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && <span className={`rounded-lg p-1.5 ${toneCls}`}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function TabLinks({
  tabs,
  active,
}: {
  tabs: { href: string; label: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="no-print mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => {
        const on = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              on ? "border-ink-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{t.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function TabButtons<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="no-print inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === t.id ? "bg-ink-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "good" | "warn" | "danger" | "info" | "muted";
  children: React.ReactNode;
}) {
  const cls = {
    good: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
    info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    muted: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  }[tone];
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function Table({
  head,
  children,
  empty,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">{head}</thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
      {empty && <p className="p-8 text-center text-sm text-slate-500">Nothing to show here.</p>}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function NoAccess() {
  return (
    <div className="card mx-auto mt-16 max-w-md p-8 text-center">
      <h2 className="text-lg font-semibold">No access</h2>
      <p className="mt-2 text-sm text-slate-500">
        Your account doesn&apos;t have permission to view this page. Ask an admin to assign it.
      </p>
    </div>
  );
}
