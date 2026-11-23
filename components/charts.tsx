"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

const axis = { stroke: "#94a3b8", fontSize: 12, tickLine: false, axisLine: false } as const;
const grid = <CartesianGrid stroke="#e2e8f0" strokeDasharray="0" vertical={false} />;

function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1e7) return (n / 1e7).toFixed(1) + "Cr";
  if (a >= 1e5) return (n / 1e5).toFixed(1) + "L";
  if (a >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return String(n);
}

function Tip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-slate-900">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-slate-900">
            {money ? "₹" : ""}
            {Number(p.value).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

const legend = (
  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#475569", paddingTop: 8 }} />
);

export function BarChartBox<T extends object>({
  data,
  xKey,
  series,
  height = 280,
  money,
  stacked,
  horizontal,
}: {
  data: T[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  money?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, left: horizontal ? 8 : -8, bottom: 0 }}
        barGap={2}
        barCategoryGap="22%"
      >
        {horizontal ? <CartesianGrid stroke="#e2e8f0" horizontal={false} /> : grid}
        {horizontal ? (
          <>
            <XAxis type="number" {...axis} tickFormatter={compact} />
            <YAxis type="category" dataKey={xKey} {...axis} width={130} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axis} />
            <YAxis {...axis} tickFormatter={compact} />
          </>
        )}
        <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Tip money={money} />} />
        {series.length > 1 && legend}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            stackId={stacked ? "a" : undefined}
            radius={stacked && i < series.length - 1 ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            stroke={stacked ? "#fff" : undefined}
            strokeWidth={stacked ? 1 : 0}
            maxBarSize={36}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineChartBox<T extends object>({
  data,
  xKey,
  series,
  height = 280,
  money,
}: {
  data: T[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  money?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        {grid}
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} tickFormatter={compact} />
        <Tooltip cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} content={<Tip money={money} />} />
        {series.length > 1 && legend}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaChartBox<T extends object>({
  data,
  xKey,
  series,
  height = 280,
  money,
}: {
  data: T[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  money?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {grid}
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} tickFormatter={compact} />
        <Tooltip cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} content={<Tip money={money} />} />
        {series.length > 1 && legend}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#g-${s.key})`}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ShareBar({
  parts,
}: {
  parts: { label: string; value: number; color: string; display?: string }[];
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <div
            key={p.label}
            title={`${p.label}: ${p.display ?? p.value}`}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-600">{p.label}</span>
            <span className="ml-auto font-medium tabular-nums text-slate-900">{p.display ?? p.value}</span>
            <span className="w-12 text-right text-xs tabular-nums text-slate-500">
              {Math.round((p.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
