"use client";

import { useState } from "react";
import { AlertTriangle, CheckCheck, Send, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { HandoverNote, Section } from "@/lib/types";
import { Badge, PageHeader, TabButtons } from "@/components/ui";
import { SECTION_META, fmtDateTime, uid } from "@/lib/utils";

const currentShift = (): HandoverNote["shift"] => {
  const h = new Date().getHours();
  return h >= 6 && h < 14 ? "Morning" : h >= 14 && h < 22 ? "Evening" : "Night";
};

export default function Handover() {
  const { data, user, update } = useStore();
  const me = user!.name;
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [section, setSection] = useState<Section | "general">("general");
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");

  const notes = data.handover.filter((n) =>
    filter === "unread"
      ? n.author !== me && !n.acknowledgedBy.includes(me)
      : filter === "urgent"
        ? n.priority === "urgent"
        : true,
  );
  const unread = data.handover.filter((n) => n.author !== me && !n.acknowledgedBy.includes(me)).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Shift handover"
        subtitle="Leave notes for the next shift — problems, pending work, things to watch."
      />

      <form
        className="card space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          update((d) => {
            d.handover.unshift({
              id: uid(),
              at: new Date().toISOString(),
              author: me,
              shift: currentShift(),
              priority: urgent ? "urgent" : "normal",
              section,
              text: text.trim(),
              acknowledgedBy: [],
            });
          });
          setText("");
          setUrgent(false);
        }}
      >
        <textarea
          className="input min-h-24 text-base"
          placeholder="e.g. Fridge 2 not cooling — moved dairy to fridge 1, technician coming at 4 pm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto py-1.5"
            value={section}
            onChange={(e) => setSection(e.target.value as Section | "general")}
          >
            <option value="general">General</option>
            {user!.sections.map((s) => (
              <option key={s} value={s}>
                {SECTION_META[s].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setUrgent(!urgent)}
            className={`btn px-3 py-1.5 ${urgent ? "bg-red-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          >
            <AlertTriangle size={14} /> Urgent
          </button>
          <span className="text-xs text-slate-500">{currentShift()} shift</span>
          <button className="btn-primary ml-auto" disabled={!text.trim()}>
            <Send size={16} /> Post note
          </button>
        </div>
      </form>

      <TabButtons
        active={filter}
        onChange={setFilter}
        tabs={[
          { id: "all", label: "All" },
          { id: "unread", label: "Not acknowledged", count: unread },
          { id: "urgent", label: "Urgent" },
        ]}
      />

      <ul className="space-y-3">
        {notes.map((n) => {
          const mine = n.author === me;
          const acked = n.acknowledgedBy.includes(me);
          return (
            <li
              key={n.id}
              className={`card p-4 ${n.priority === "urgent" ? "border-red-200 bg-red-50/40" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                  {n.author
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="text-sm font-medium text-slate-900">{n.author}</span>
                <span className="text-slate-500">
                  {fmtDateTime(n.at)} · {n.shift} shift
                </span>
                {n.priority === "urgent" && (
                  <Badge tone="danger">
                    <AlertTriangle size={11} /> Urgent
                  </Badge>
                )}
                <span className="ml-auto">
                  {n.section === "general" ? (
                    <Badge tone="muted">General</Badge>
                  ) : (
                    <Badge tone="muted">{SECTION_META[n.section].label}</Badge>
                  )}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{n.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <CheckCheck size={14} />
                {n.acknowledgedBy.length ? `Seen by ${n.acknowledgedBy.join(", ")}` : "Not seen yet"}
                <span className="ml-auto flex gap-2">
                  {!mine && !acked && (
                    <button
                      className="btn-primary px-3 py-1 text-xs"
                      onClick={() =>
                        update((d) => {
                          d.handover.find((x) => x.id === n.id)!.acknowledgedBy.push(me);
                        })
                      }
                    >
                      Got it
                    </button>
                  )}
                  {(mine || user!.role === "admin") && (
                    <button
                      className="rounded p-1 text-slate-400 hover:text-red-600"
                      title="Delete"
                      onClick={() =>
                        confirm("Delete this note?") &&
                        update((d) => {
                          d.handover = d.handover.filter((x) => x.id !== n.id);
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
            </li>
          );
        })}
        {!notes.length && <li className="py-8 text-center text-sm text-slate-500">No notes here.</li>}
      </ul>
    </div>
  );
}
