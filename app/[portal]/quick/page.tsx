"use client";

import { useCallback, useState } from "react";
import { ScanLine, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Modal, PageHeader } from "@/components/ui";
import Scanner from "@/components/Scanner";
import MyRequests from "@/components/MyRequests";
import {
  ItemCard,
  ItemPicker,
  StockActionForm,
  Toast,
  findByCode,
  itemInfo,
  type ItemRef,
} from "@/components/StockAction";

export default function QuickEntry() {
  const { data, user } = useStore();
  const [ref, setRef] = useState<ItemRef | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [notFound, setNotFound] = useState("");
  const clear = useCallback(() => setResult(null), []);
  const info = ref ? itemInfo(data, ref) : null;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader title="Quick entry" subtitle="Stock in, stock out and sales in a few taps." />

      {!info ? (
        <>
          <button className="btn-primary h-12 w-full text-base" onClick={() => setScanning(true)}>
            <ScanLine size={18} /> Scan barcode
          </button>
          {notFound && <p className="text-sm text-amber-700">No item found for “{notFound}”.</p>}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or pick an item{" "}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <ItemPicker onPick={setRef} />
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <ItemCard info={info} />
            <button
              className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-slate-500 shadow"
              onClick={() => setRef(null)}
              aria-label="Change item"
            >
              <X size={16} />
            </button>
          </div>
          <div className="card p-4">
            <StockActionForm info={info} onDone={setResult} />
          </div>
          <button className="btn-ghost w-full" onClick={() => setRef(null)}>
            Choose another item
          </button>
        </div>
      )}

      <MyRequests />

      <Modal open={scanning} onClose={() => setScanning(false)} title="Scan item">
        {scanning && (
          <Scanner
            onResult={(code) => {
              const r = findByCode(data, code, user!.sections);
              setScanning(false);
              if (r) {
                setRef(r);
                setNotFound("");
              } else setNotFound(code);
            }}
          />
        )}
      </Modal>
      <Toast result={result} onDone={clear} />
    </div>
  );
}
