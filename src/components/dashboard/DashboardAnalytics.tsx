"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Types ────────────────────────────────────────────────────────────────────

interface VolumeDay { date: string; count: number }
interface StatusSlice { status: string; count: number }
interface DentistBar { name: string; count: number }
interface Trend { current: number; previous: number; pct: number | null }

interface StatsPayload {
  volumeByDay: VolumeDay[];
  statusBreakdown: StatusSlice[];
  dentistWorkload: DentistBar[];
  trend: Trend;
}

// ── Colour maps ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  REQUESTED:   "#f59e0b",
  SCHEDULED:   "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED:   "#10b981",
  CANCELLED:   "#9ca3af",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED:   "Solicitado",
  SCHEDULED:   "Agendado",
  IN_PROGRESS: "Em Atendimento",
  COMPLETED:   "Concluído",
  CANCELLED:   "Cancelado",
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function TrendChip({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  chip,
}: {
  label: string;
  value: number | string;
  sub?: string;
  chip?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <p className="text-xs text-gray-400 uppercase tracking-wide leading-none">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-gray-900 leading-none">{value}</span>
        {chip}
      </div>
      {sub && <p className="text-xs text-gray-400 leading-none">{sub}</p>}
    </div>
  );
}

// ── Custom tooltip for area chart ─────────────────────────────────────────────

function VolumeTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  let dayLabel = label ?? "";
  try { dayLabel = format(parseISO(label!), "EEE, d MMM", { locale: ptBR }); } catch {}
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <p className="text-gray-500">{dayLabel}</p>
      <p className="font-semibold text-indigo-700">{payload[0].value} consultas</p>
    </div>
  );
}

// ── Custom tooltip for donut ──────────────────────────────────────────────────

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <p className="text-gray-500">{STATUS_LABEL[name] ?? name}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardAnalytics({ apptToday, apptPending, totalPatients }: {
  apptToday: number;
  apptPending: number;
  totalPatients: number | null;
}) {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setStats(data); setLoading(false); });
  }, []);

  // Short weekday labels for sparkline X axis
  const xFormatter = (v: string) => {
    try { return format(parseISO(v), "EEE", { locale: ptBR }); } catch { return v; }
  };

  return (
    <div className="flex items-stretch gap-6 px-5 py-3 flex-1 overflow-x-auto">

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 shrink-0">
        <StatCard
          label="Hoje"
          value={apptToday}
          sub="consultas"
        />
        <div className="w-px h-10 bg-gray-200" />
        <StatCard
          label="Esta semana"
          value={loading ? "…" : stats?.trend.current ?? "—"}
          sub="vs semana passada"
          chip={loading ? undefined : <TrendChip pct={stats?.trend.pct ?? null} />}
        />
        <div className="w-px h-10 bg-gray-200" />
        <StatCard
          label="Pendentes"
          value={apptPending}
          sub="aguardando"
        />
        {totalPatients !== null && (
          <>
            <div className="w-px h-10 bg-gray-200" />
            <StatCard label="Pacientes" value={totalPatients} sub="cadastrados" />
          </>
        )}
      </div>

      <div className="w-px bg-gray-200 shrink-0" />

      {/* ── 7-day sparkline ────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between shrink-0 w-44">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Últimos 7 dias</p>
        {loading ? (
          <Skeleton className="h-14 w-full mt-1" />
        ) : (
          <ResponsiveContainer width="100%" height={56}>
            <AreaChart data={stats?.volumeByDay ?? []} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={xFormatter} tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={1} />
              <Tooltip content={<VolumeTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 3, fill: "#6366f1" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="w-px bg-gray-200 shrink-0" />

      {/* ── Status donut ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col justify-between h-full">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Esta semana</p>
          {loading ? (
            <Skeleton className="h-14 w-14 rounded-full mt-1" />
          ) : (
            <ResponsiveContainer width={68} height={68}>
              <PieChart>
                <Pie
                  data={stats?.statusBreakdown ?? []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={32}
                  strokeWidth={0}
                >
                  {(stats?.statusBreakdown ?? []).map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? "#e5e7eb"} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Legend */}
        {!loading && stats && (
          <div className="flex flex-col gap-1">
            {stats.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STATUS_COLOR[s.status] ?? "#e5e7eb" }}
                />
                <span className="text-[10px] text-gray-500 leading-none">
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
                <span className="text-[10px] font-semibold text-gray-700 leading-none ml-auto pl-2">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        )}
        {loading && <Skeleton className="h-14 w-20" />}
      </div>

      <div className="w-px bg-gray-200 shrink-0" />

      {/* ── Per-dentist bar ────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between shrink-0 min-w-[160px]">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Carga por dentista</p>
        {loading ? (
          <Skeleton className="h-14 w-full mt-1" />
        ) : stats?.dentistWorkload.length ? (
          <ResponsiveContainer width="100%" height={Math.max(48, (stats.dentistWorkload.length) * 18)}>
            <BarChart
              layout="vertical"
              data={stats.dentistWorkload}
              margin={{ top: 2, right: 24, bottom: 0, left: 0 }}
              barSize={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.replace(/^Dr\.?\s*/i, "").split(" ")[0]}
              />
              <Tooltip
                formatter={(v) => [`${v} consultas`, ""]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", padding: "4px 10px" }}
                cursor={{ fill: "#f3f4f6" }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-gray-400 mt-2">Sem dados</p>
        )}
      </div>

    </div>
  );
}
