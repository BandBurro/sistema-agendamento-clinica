"use client";

import { useState, useCallback, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { DayDetailView } from "@/components/calendar/DayDetailView";
import { AppointmentDetailPanel } from "@/components/appointments/AppointmentDetailPanel";
import type { AppointmentWithRelations } from "@/types";
import type { Role } from "@/generated/prisma/client";

interface Stats {
  apptToday: number;
  apptWeek: number;
  apptPending: number;
  totalPatients: number | null;
}

interface Props {
  role: Role;
  dentists: { id: string; user: { name: string } }[];
  stats: Stats;
}

function StatPill({
  label,
  value,
  bg,
  color,
}: {
  label: string;
  value: number | string;
  bg: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
        <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      </div>
      <span className="text-xs text-gray-400 leading-tight text-center">{label}</span>
    </div>
  );
}

function getThisMonday(): Date {
  const now = new Date();
  return startOfWeek(now, { weekStartsOn: 1 });
}

export function DashboardClient({ role, dentists, stats }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(getThisMonday);
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const canFilter = role === "ADMIN" || role === "RECEPTIONIST";
  const canChangeStatus = role !== "PATIENT";
  const canReschedule = role === "ADMIN" || role === "RECEPTIONIST";

  const fromStr = format(weekStart, "yyyy-MM-dd");
  const toStr   = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ from: fromStr, to: toStr });
    if (selectedDentist) params.set("dentistId", selectedDentist);
    const res = await fetch(`/api/appointments?${params}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [fromStr, toStr, selectedDentist]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  function handleUpdated(updated: AppointmentWithRelations) {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  }

  function handleDayChange(newDay: Date) {
    setSelectedDay(newDay);
    // If new day falls outside the fetched week, slide the week view to cover it
    const newMonday = startOfWeek(newDay, { weekStartsOn: 1 });
    const currentEnd = addDays(weekStart, 6);
    if (newDay < weekStart || newDay > currentEnd) {
      setWeekStart(newMonday);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Stats + filter bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 shrink-0 bg-white">
        <div className="flex items-center gap-5">
          <StatPill label="Hoje"      value={stats.apptToday}   bg="bg-indigo-100"  color="text-indigo-700" />
          <StatPill label="7 dias"    value={stats.apptWeek}    bg="bg-violet-100"  color="text-violet-700" />
          <StatPill label="Pendentes" value={stats.apptPending} bg="bg-amber-100"   color="text-amber-700" />
          {stats.totalPatients !== null && (
            <StatPill label="Pacientes" value={stats.totalPatients} bg="bg-emerald-100" color="text-emerald-700" />
          )}
        </div>

        {canFilter && dentists.length > 0 && (
          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            className="text-sm text-gray-900 border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <option value="">Todos os dentistas</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.user.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Calendar + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        {selectedDay ? (
          <DayDetailView
            day={selectedDay}
            appointments={appointments}
            loading={loading}
            onBack={() => setSelectedDay(null)}
            onDayChange={handleDayChange}
            onAppointmentClick={setSelected}
            selectedId={selected?.id}
          />
        ) : (
          <WeekCalendar
            appointments={appointments}
            weekStart={weekStart}
            loading={loading}
            onNavigate={setWeekStart}
            onAppointmentClick={setSelected}
            onDayClick={setSelectedDay}
            selectedId={selected?.id}
          />
        )}

        {selected && (
          <AppointmentDetailPanel
            appointment={selected}
            onClose={() => setSelected(null)}
            onUpdated={handleUpdated}
            canChangeStatus={canChangeStatus}
            canReschedule={canReschedule}
          />
        )}
      </div>
    </div>
  );
}
