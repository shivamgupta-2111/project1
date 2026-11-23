"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { QrCode, RotateCcw, SearchX } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import Scanner from "@/components/Scanner";
import {
  ItemCard,
  StockActionForm,
  Toast,
  findByCode,
  itemInfo,
  type ItemRef,
} from "@/components/StockAction";

export default function ScanPage() {
  const { data, user } = useStore();
  const [ref, setRef] = useState<ItemRef | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const clear = useCallback(() => setResult(null), []);
  const info = ref ? itemInfo(data, ref) : null;

  const onCode = (code: string) => {
    const r = findByCode(data, code, user!.sections);
    if (r) {
      setRef(r);
      setMissing(null);
    } else setMissing(code);
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Scan"
        subtitle="Scan a barcode or QR to find an item, receive stock or record a sale."
        actions={
          <Link href={`/${user!.role}/labels`} className="btn-ghost">
            <QrCode size={16} /> Labels
          </Link>
        }
      />
      {!info ? (
        <div className="space-y-3">
          <Scanner onResult={onCode} />
          {missing && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <SearchX size={18} className="mt-0.5 shrink-0" />
              <span>
                No item found for <b className="font-mono">{missing}</b>
                {user!.role === "admin"
                  ? " — add it in the warehouse with this barcode."
                  : " in your sections. Ask an admin to add it."}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ItemCard info={info} />
          <div className="card p-4">
            <StockActionForm info={info} onDone={setResult} />
          </div>
          <button className="btn-ghost h-12 w-full" onClick={() => setRef(null)}>
            <RotateCcw size={16} /> Scan next item
          </button>
        </div>
      )}
      <Toast result={result} onDone={clear} />
    </div>
  );
}
