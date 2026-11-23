"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Shell from "@/components/Shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { portal } = useParams<{ portal: string }>();
  const { ready, user } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role !== portal) router.replace(`/${user.role}`);
  }, [ready, user, portal, router]);

  if (!ready || !user || user.role !== portal) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
      </div>
    );
  }
  return <Shell portal={portal as "admin" | "rep"}>{children}</Shell>;
}
