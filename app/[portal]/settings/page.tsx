"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, Field, NoAccess, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const { data, user, update, resetDemo } = useStore();
  const [f, setF] = useState(data.settings);
  const [saved, setSaved] = useState(false);
  if (user!.role !== "admin") return <NoAccess />;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" subtitle="Firm details and alert thresholds" />
      <Card title="Firm">
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            update((d) => {
              d.settings = {
                ...d.settings,
                firmName: f.firmName,
                ownerName: f.ownerName,
                expiryWarningDays: f.expiryWarningDays,
              };
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          <div className="col-span-2">
            <Field label="Firm name">
              <input
                className="input"
                value={f.firmName}
                onChange={(e) => setF({ ...f, firmName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Owner name">
            <input
              className="input"
              value={f.ownerName}
              onChange={(e) => setF({ ...f, ownerName: e.target.value })}
            />
          </Field>
          <Field label="Warn about expiry (days before)">
            <input
              className="input"
              type="number"
              min={1}
              value={f.expiryWarningDays}
              onChange={(e) => setF({ ...f, expiryWarningDays: Number(e.target.value) })}
            />
          </Field>
          <div className="col-span-2 flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-emerald-700">Saved</span>}
            <button className="btn-primary">Save settings</button>
          </div>
        </form>
      </Card>
      <Card title="Approval rules for reps">
        <div className="space-y-4">
          <label className="block max-w-xs">
            <span className="label">Adjustments of this many units or more need approval</span>
            <input
              className="input"
              type="number"
              min={1}
              value={data.settings.approvalThreshold}
              onChange={(e) =>
                update((d) => {
                  d.settings.approvalThreshold = Math.max(1, Number(e.target.value));
                })
              }
            />
          </label>
          {(
            [
              ["approveWriteOffs", "All write-offs (damaged / expired) need approval"],
              ["approveExports", "All raw-material exports need approval"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.settings[k]}
                onChange={(e) =>
                  update((d) => {
                    d.settings[k] = e.target.checked;
                  })
                }
              />
              {label}
            </label>
          ))}
          <p className="text-xs text-slate-500">
            Admins are never asked for approval. Changes save immediately.
          </p>
        </div>
      </Card>
      <Card title="Demo data">
        <p className="mb-4 text-sm text-slate-600">
          Data is currently stored in this browser. Resetting restores the original sample data and removes
          everything you&apos;ve added.
        </p>
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm("Reset all data to the demo sample?")) resetDemo();
          }}
        >
          Reset demo data
        </button>
      </Card>
    </div>
  );
}
