"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import QRCode from "qrcode";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { SECTION_META } from "@/lib/utils";

function QR({ value }: { value: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(value, { type: "svg", margin: 0, width: 96 }).then(setSvg);
  }, [value]);
  return <div className="h-24 w-24" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function Labels() {
  const { data, user } = useStore();
  const [sec, setSec] = useState<"grocery" | "bright-idea">(
    user!.sections.includes("grocery") ? "grocery" : "bright-idea",
  );
  const items =
    sec === "grocery"
      ? data.grocery.map((g) => ({
          id: g.id,
          name: g.name,
          code: g.barcode,
          sub: `${g.sku} · ₹${g.sellPrice}`,
        }))
      : data.bright.map((b) => ({ id: b.id, name: b.productName, code: b.barcode, sub: `₹${b.unitPrice}` }));

  return (
    <div>
      <PageHeader
        title="Barcode labels"
        subtitle="Print QR labels for shelves and cartons. Each QR holds the item's barcode, so the Scan screen finds it."
        actions={
          <>
            <select
              className="input w-auto"
              value={sec}
              onChange={(e) => setSec(e.target.value as typeof sec)}
            >
              {(["grocery", "bright-idea"] as const)
                .filter((s) => user!.sections.includes(s))
                .map((s) => (
                  <option key={s} value={s}>
                    {SECTION_META[s].label}
                  </option>
                ))}
            </select>
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3 break-inside-avoid"
          >
            <QR value={i.code} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{i.name}</p>
              <p className="mt-1 text-xs text-slate-500">{i.sub}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-600">{i.code}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
