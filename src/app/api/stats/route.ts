import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  const role = session!.user.role;
  const userId = session!.user.id;

  // Build base where clause for role scoping
  const baseWhere: Record<string, unknown> = {};
  if (role === "DENTIST") {
    const dentist = await prisma.dentist.findUnique({ where: { userId } });
    if (dentist) baseWhere.dentistId = dentist.id;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Current week: Mon–Sun
  const currentWeekStart = new Date(now);
  const day = currentWeekStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  currentWeekStart.setDate(currentWeekStart.getDate() + diffToMonday);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

  // Previous week
  const prevWeekStart = new Date(currentWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(currentWeekStart);

  // Last 7 days (for sparkline — today inclusive going back)
  const last7Start = new Date(now);
  last7Start.setDate(last7Start.getDate() - 6);
  const last7End = new Date(now);
  last7End.setDate(last7End.getDate() + 1);

  // ── 1. Raw appointments for the last 7 days ──────────────────────────────
  const last7Appts = await prisma.appointment.findMany({
    where: {
      ...baseWhere,
      date: { gte: last7Start, lt: last7End },
    },
    select: { date: true, status: true, dentistId: true },
  });

  // ── 2. Volume by day (sparkline) ─────────────────────────────────────────
  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(last7Start);
    d.setDate(d.getDate() + i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const appt of last7Appts) {
    const key = new Date(appt.date).toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key]++;
  }
  const volumeByDay = Object.entries(dayMap).map(([date, count]) => ({
    date,
    count,
  }));

  // ── 3. Status breakdown (donut) — current week ───────────────────────────
  const currentWeekAppts = await prisma.appointment.findMany({
    where: {
      ...baseWhere,
      date: { gte: currentWeekStart, lt: currentWeekEnd },
    },
    select: { status: true },
  });

  const statusCount: Record<string, number> = {
    REQUESTED: 0,
    SCHEDULED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const a of currentWeekAppts) statusCount[a.status]++;
  const statusBreakdown = Object.entries(statusCount)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ status, count }));

  // ── 4. Per-dentist workload — current week ───────────────────────────────
  const dentistAppts = await prisma.appointment.findMany({
    where: {
      ...baseWhere,
      date: { gte: currentWeekStart, lt: currentWeekEnd },
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      dentistId: true,
      dentist: { include: { user: { select: { name: true } } } },
    },
  });

  const dentistMap: Record<string, { name: string; count: number }> = {};
  for (const a of dentistAppts) {
    const id = a.dentistId;
    if (!dentistMap[id]) {
      dentistMap[id] = { name: a.dentist.user.name, count: 0 };
    }
    dentistMap[id].count++;
  }
  const dentistWorkload = Object.values(dentistMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ── 5. Trend — current week vs prev week ────────────────────────────────
  const [currTotal, prevTotal] = await Promise.all([
    prisma.appointment.count({
      where: { ...baseWhere, date: { gte: currentWeekStart, lt: currentWeekEnd } },
    }),
    prisma.appointment.count({
      where: { ...baseWhere, date: { gte: prevWeekStart, lt: prevWeekEnd } },
    }),
  ]);

  const trendPct =
    prevTotal === 0
      ? null
      : Math.round(((currTotal - prevTotal) / prevTotal) * 100);

  return NextResponse.json({
    volumeByDay,
    statusBreakdown,
    dentistWorkload,
    trend: { current: currTotal, previous: prevTotal, pct: trendPct },
  });
}
