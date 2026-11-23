"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ErpAction, ErpData, Section, User } from "./types";
import { buildSeed } from "./seed";
import { performAction, pushActivity, submitInDraft } from "./actions";

const DATA_KEY = "erp-data-v2";
const SESSION_KEY = "erp-session-v1";

interface Store {
  ready: boolean;
  data: ErpData;
  user: User | null;
  update: (fn: (draft: ErpData) => void) => void;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  resetDemo: () => void;
  logActivity: (e: { section: Section; action: string; itemName: string; delta: number }) => void;
  submit: (a: ErpAction) => { status: "applied" | "pending" | "error"; message: string };
  decide: (approvalId: string, approve: boolean, note?: string) => string | null;
  run: (fn: (draft: ErpData) => string | null | void) => string | null;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<ErpData>(() => buildSeed());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) setData(JSON.parse(raw));
      setUserId(localStorage.getItem(SESSION_KEY));
    } catch {
      // localStorage blocked, just use seed data
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {}
  }, [data, ready]);

  const update = useCallback((fn: (draft: ErpData) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const user = useMemo(
    () => data.users.find((u) => u.id === userId && u.active) ?? null,
    [data.users, userId],
  );

  const login = useCallback(
    (email: string, password: string) => {
      const u = data.users.find(
        (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password && x.active,
      );
      if (u) {
        setUserId(u.id);
        try {
          localStorage.setItem(SESSION_KEY, u.id);
        } catch {}
      }
      return u ?? null;
    },
    [data.users],
  );

  const logout = useCallback(() => {
    setUserId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const resetDemo = useCallback(() => setData(buildSeed()), []);

  const logActivity = useCallback<Store["logActivity"]>(
    (e) => update((d) => pushActivity(d, { ...e, userName: user?.name ?? "System" })),
    [update, user?.name],
  );

  const submit = useCallback<Store["submit"]>(
    (a) => {
      if (!user) return { status: "error", message: "Not signed in" };
      const next = structuredClone(data);
      const r = submitInDraft(next, user, a);
      if (r.status !== "error") setData(next);
      return r;
    },
    [data, user],
  );

  const run = useCallback<Store["run"]>(
    (fn) => {
      const next = structuredClone(data);
      const err = fn(next);
      if (err) return err;
      setData(next);
      return null;
    },
    [data],
  );

  const decide = useCallback<Store["decide"]>(
    (id, approve, note) => {
      const next = structuredClone(data);
      const req = next.approvals.find((r) => r.id === id);
      if (!req || req.status !== "pending") return "Request not found";
      if (approve) {
        const err = performAction(next, req.action, req.requestedBy);
        if (err) return err;
      }
      req.status = approve ? "approved" : "rejected";
      req.decidedBy = user?.name;
      req.decidedAt = new Date().toISOString();
      req.note = note;
      req.seenByRequester = false;
      setData(next);
      return null;
    },
    [data, user?.name],
  );

  return (
    <Ctx.Provider
      value={{ ready, data, user, update, login, logout, resetDemo, logActivity, submit, decide, run }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
