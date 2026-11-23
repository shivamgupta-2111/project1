"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Keyboard } from "lucide-react";

// note: camera only works on https or localhost
export default function Scanner({
  onResult,
  paused,
}: {
  onResult: (code: string) => void;
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cbRef = useRef(onResult);
  const pausedRef = useRef(paused);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  cbRef.current = onResult;
  pausedRef.current = paused;

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("This browser can't open the camera here (it needs HTTPS).");
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (!result || pausedRef.current) return;
            const code = result.getText();
            const now = Date.now();
            // same code twice in a row, skip
            if (code === lastRef.current.code && now - lastRef.current.at < 2500) return;
            lastRef.current = { code, at: now };
            navigator.vibrate?.(60);
            cbRef.current(code);
          },
        );
        if (cancelled) controls.stop();
        else stop = () => controls.stop();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          /Permission|NotAllowed/i.test(msg)
            ? "Camera permission was blocked. Allow camera access in your browser settings."
            : msg,
        );
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink-900">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-300">
            <CameraOff size={28} />
            {error}
          </div>
        ) : (
          <>
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-1/2 w-3/4 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,32,0.45)]" />
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
              Point at a barcode or QR code
            </p>
          </>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) onResult(manual.trim());
          setManual("");
        }}
      >
        <div className="relative flex-1">
          <Keyboard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            inputMode="numeric"
            placeholder="Or type the barcode / SKU"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
        </div>
        <button className="btn-ghost">Find</button>
      </form>
    </div>
  );
}
