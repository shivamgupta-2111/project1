"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Section, User } from "@/lib/types";
import { Badge, Field, Modal, NoAccess, PageHeader, Table } from "@/components/ui";
import { SECTION_META, uid } from "@/lib/utils";

const ALL: Section[] = ["grocery", "bright-idea", "raw-material"];

export default function Users() {
  const { data, user, update } = useStore();
  const [editing, setEditing] = useState<User | null>(null);
  if (user!.role !== "admin") return <NoAccess />;

  const activityCount = (name: string) => data.activity.filter((a) => a.userName === name).length;
  const flagCount = (name: string) => data.activity.filter((a) => a.userName === name && a.suspicious).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & reps"
        subtitle="Create rep logins and choose which warehouse sections each rep can work in."
        actions={
          <button
            className="btn-primary"
            onClick={() =>
              setEditing({
                id: uid(),
                name: "",
                email: "",
                password: "",
                role: "rep",
                active: true,
                sections: ["grocery"],
                monthlySalesTarget: 200000,
                weeklyTaskTarget: 12,
              })
            }
          >
            <Plus size={16} /> Add rep
          </button>
        }
      />
      <Table
        head={
          <tr>
            <th className="th">Name</th>
            <th className="th">Role</th>
            <th className="th">Sections</th>
            <th className="th text-right">Activities</th>
            <th className="th text-right">Flags</th>
            <th className="th">Status</th>
            <th className="th" />
          </tr>
        }
      >
        {data.users.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50">
            <td className="td">
              <p className="font-medium text-slate-900">{u.name}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </td>
            <td className="td">
              {u.role === "admin" ? <Badge tone="info">Admin</Badge> : <Badge tone="muted">Rep</Badge>}
            </td>
            <td className="td">
              <div className="flex flex-wrap gap-1">
                {u.sections.map((s) => (
                  <span key={s} className="badge bg-slate-100 text-slate-700">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: SECTION_META[s].color }}
                    />
                    {SECTION_META[s].label}
                  </span>
                ))}
              </div>
            </td>
            <td className="td text-right tabular-nums">{activityCount(u.name)}</td>
            <td className="td text-right tabular-nums">
              {flagCount(u.name) ? <Badge tone="danger">{flagCount(u.name)}</Badge> : 0}
            </td>
            <td className="td">
              <button
                disabled={u.id === user!.id}
                onClick={() =>
                  update((d) => {
                    const x = d.users.find((y) => y.id === u.id)!;
                    x.active = !x.active;
                  })
                }
                className="disabled:cursor-not-allowed"
                title={u.id === user!.id ? "You can't disable yourself" : "Toggle access"}
              >
                {u.active ? <Badge tone="good">Active</Badge> : <Badge tone="muted">Disabled</Badge>}
              </button>
            </td>
            <td className="td text-right">
              <button
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={() => setEditing(u)}
                title="Edit"
              >
                <Pencil size={16} />
              </button>
            </td>
          </tr>
        ))}
      </Table>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && data.users.some((u) => u.id === editing.id) ? "Edit user" : "Add rep"}
      >
        {editing && (
          <UserForm
            initial={editing}
            isSelf={editing.id === user!.id}
            emailTaken={(email, id) =>
              data.users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id)
            }
            onSave={(u) => {
              update((d) => {
                const i = d.users.findIndex((x) => x.id === u.id);
                if (i >= 0) d.users[i] = u;
                else d.users.push(u);
              });
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function UserForm({
  initial,
  isSelf,
  emailTaken,
  onSave,
}: {
  initial: User;
  isSelf: boolean;
  emailTaken: (email: string, id: string) => boolean;
  onSave: (u: User) => void;
}) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (emailTaken(f.email, f.id)) return setErr("Another user already has this email.");
        if (!f.sections.length) return setErr("Pick at least one section.");
        if (f.password.length < 4) return setErr("Password must be at least 4 characters.");
        onSave(f);
      }}
    >
      <Field label="Full name">
        <input
          className="input"
          required
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
      </Field>
      <Field label="Email (login)">
        <input
          className="input"
          type="email"
          required
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
      </Field>
      <Field label="Password">
        <input
          className="input"
          required
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
      </Field>
      <Field label="Role">
        <select
          className="input"
          disabled={isSelf}
          value={f.role}
          onChange={(e) => setF({ ...f, role: e.target.value as User["role"] })}
        >
          <option value="rep">Rep</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly sales target (₹)">
          <input
            className="input"
            type="number"
            min={0}
            value={f.monthlySalesTarget}
            onChange={(e) => setF({ ...f, monthlySalesTarget: Number(e.target.value) })}
          />
        </Field>
        <Field label="Weekly task target">
          <input
            className="input"
            type="number"
            min={0}
            value={f.weeklyTaskTarget}
            onChange={(e) => setF({ ...f, weeklyTaskTarget: Number(e.target.value) })}
          />
        </Field>
      </div>
      <div>
        <span className="label">Warehouse sections</span>
        <div className="flex flex-wrap gap-2">
          {ALL.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={f.sections.includes(s)}
                onChange={(e) =>
                  setF({
                    ...f,
                    sections: e.target.checked ? [...f.sections, s] : f.sections.filter((x) => x !== s),
                  })
                }
              />
              {SECTION_META[s].label}
            </label>
          ))}
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex justify-end">
        <button className="btn-primary">Save</button>
      </div>
    </form>
  );
}
