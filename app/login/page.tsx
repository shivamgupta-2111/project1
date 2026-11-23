"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ShieldCheck, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const { ready, user, login, data } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace(`/${user.role}`);
  }, [ready, user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(email, password);
    if (!u) setError("Wrong email or password, or the account is disabled.");
    else router.replace(`/${u.role}`);
  };

  const quick = (role: "admin" | "rep") => {
    const u = role === "admin" ? login("admin@erp.com", "admin123") : login("rep@erp.com", "rep123");
    if (u) router.replace(`/${u.role}`);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
            <BarChart3 size={20} />
          </span>
          <span className="font-semibold">{data.settings.firmName}</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            One place for your
            <br />
            whole warehouse.
          </h1>
          <div className="mt-8 grid max-w-md gap-3">
            {[
              ["#1baf7a", "Grocery", "Stock, shelves, expiry, backlog, suspicious activity"],
              ["#eb6834", "Bright Idea", "Products by supplier & region, low-stock alerts"],
              ["#2a78d6", "Raw Material", "Grain, pulse, vegetables & meat — import / export"],
            ].map(([c, t, d]) => (
              <div key={t} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: c }} />
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-slate-400">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">Accounts · Warehouse · Reports</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Admins and reps use the same sign-in; you&apos;ll land in your own portal.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="label">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full py-2.5">Sign in</button>
          </form>

          <div className="mt-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quick("admin")} className="btn-ghost justify-start py-3">
                <ShieldCheck size={16} />
                <span className="text-left">
                  <span className="block">Admin</span>
                  <span className="block text-xs font-normal text-slate-500">admin@erp.com</span>
                </span>
              </button>
              <button onClick={() => quick("rep")} className="btn-ghost justify-start py-3">
                <UserRound size={16} />
                <span className="text-left">
                  <span className="block">Rep</span>
                  <span className="block text-xs font-normal text-slate-500">rep@erp.com</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
