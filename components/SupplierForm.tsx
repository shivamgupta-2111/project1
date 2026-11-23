"use client";

import { useState } from "react";
import type { Section, Supplier } from "@/lib/types";
import { Field } from "@/components/ui";
import { SECTION_META } from "@/lib/utils";

export function SupplierForm({ initial, onSave }: { initial: Supplier; onSave: (s: Supplier) => void }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  const set = <K extends keyof Supplier>(k: K, v: Supplier[K]) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.sections.length) return setErr("Pick at least one section");
        onSave(f);
      }}
    >
      <div className="col-span-2">
        <Field label="Supplier name">
          <input className="input" required value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
      </div>
      <Field label="Contact person">
        <input
          className="input"
          value={f.contactPerson}
          onChange={(e) => set("contactPerson", e.target.value)}
        />
      </Field>
      <Field label="Phone">
        <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Email">
        <input
          className="input"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label="GSTIN">
        <input className="input" value={f.gstin} onChange={(e) => set("gstin", e.target.value)} />
      </Field>
      <div className="col-span-2">
        <Field label="Address">
          <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
      </div>
      <Field label="Payment terms (days)">
        <input
          className="input"
          type="number"
          min={0}
          value={f.paymentTermsDays}
          onChange={(e) => set("paymentTermsDays", Number(e.target.value))}
        />
      </Field>
      <div>
        <span className="label">Supplies to</span>
        <div className="flex flex-wrap gap-2">
          {(["grocery", "bright-idea", "raw-material"] as Section[]).map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={f.sections.includes(s)}
                onChange={(e) =>
                  set("sections", e.target.checked ? [...f.sections, s] : f.sections.filter((x) => x !== s))
                }
              />
              {SECTION_META[s].label}
            </label>
          ))}
        </div>
      </div>
      <div className="col-span-2">
        <Field label="Notes">
          <textarea
            className="input"
            rows={2}
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </div>
      {err && <p className="col-span-2 text-sm text-red-600">{err}</p>}
      <div className="col-span-2 flex justify-end">
        <button className="btn-primary">Save supplier</button>
      </div>
    </form>
  );
}
