"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Badge, Card } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

export default function MyRequests({ limit = 6 }: { limit?: number }) {
  const { data, user, update } = useStore();
  const mine = data.approvals.filter((a) => a.requestedBy === user!.name).slice(0, limit);
  const unseen = mine.some((a) => !a.seenByRequester);

  useEffect(() => {
    if (!unseen) return;
    const t = setTimeout(
      () =>
        update((d) => {
          d.approvals.forEach((a) => a.requestedBy === user!.name && (a.seenByRequester = true));
        }),
      1500,
    );
    return () => clearTimeout(t);
  }, [unseen, update, user]);

  if (user!.role === "admin") return null;
  return (
    <Card
      title="My approval requests"
      subtitle="Big adjustments, write-offs and exports wait for admin approval"
    >
      {mine.length === 0 ? (
        <p className="text-sm text-slate-500">No requests yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {mine.map((a) => (
            <li
              key={a.id}
              className={`py-2.5 text-sm ${!a.seenByRequester ? "rounded-lg bg-sky-50 px-2" : ""}`}
            >
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1">{a.summary}</span>
                <Badge tone={a.status === "approved" ? "good" : a.status === "rejected" ? "danger" : "warn"}>
                  {a.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {fmtDateTime(a.at)}
                {a.note && <> · “{a.note}”</>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
