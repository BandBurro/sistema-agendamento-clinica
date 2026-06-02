"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { DayDetailView } from "@/components/calendar/DayDetailView";
import { AppointmentDetailPanel } from "@/components/appointments/AppointmentDetailPanel";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { NewAppointmentModal } from "@/components/appointments/NewAppointmentModal";
import type { AppointmentWithRelations, DentistWithUser } from "@/types";
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
  const [newApptPrefill, setNewApptPrefill] = useState<{
    dentistId: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const dentistsForModalRef = useRef<DentistWithUser[]>([]);

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

  useEffect(() => {
    window.addEventListener("appointment:created", fetchAppointments);
    return () => window.removeEventListener("appointment:created", fetchAppointments);
  }, [fetchAppointments]);

  function handleUpdated(updated: AppointmentWithRelations) {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  }

  async function handleReschedule(id: string, date: string, startTime: string, endTime: string) {
    // Optimistic update so the ghost commits instantly
    setAppointments((prev) =>
      prev.map((a) =>
        a.id !== id
          ? a
          : {
              ...a,
              date: date as unknown as Date,
              startTime: new Date(`1970-01-01T${startTime}:00`) as unknown as Date,
              endTime: new Date(`1970-01-01T${endTime}:00`) as unknown as Date,
            }
      )
    );

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      if (!res.ok) {
        fetchAppointments(); // revert on failure
        return;
      }
      const updated: AppointmentWithRelations = await res.json();
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    } catch {
      fetchAppointments();
    }
  }

  async function handleCreateRequest(date: string, startTime: string, endTime: string) {
    let dents = dentistsForModalRef.current;
    if (dents.length === 0) {
      const res = await fetch("/api/dentists");
      if (res.ok) {
        dents = await res.json();
        dentistsForModalRef.current = dents;
      }
    }
    if (dents.length === 0) return;
    setNewApptPrefill({ dentistId: dents[0].id, date, startTime, endTime });
  }

  function handleDayChange(newDay: Date) {
    setSelectedDay(newDay);
    const newMonday = startOfWeek(newDay, { weekStartsOn: 1 });
    const currentEnd = addDays(weekStart, 6);
    if (newDay < weekStart || newDay > currentEnd) {
      setWeekStart(newMonday);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Analytics header */}
      {(role === "ADMIN" || role === "RECEPTIONIST") ? (
        <div className="shrink-0 flex items-center border-b border-gray-200 bg-white">
          <DashboardAnalytics
            apptToday={stats.apptToday}
            apptPending={stats.apptPending}
            totalPatients={stats.totalPatients}
          />
          {canFilter && dentists.length > 0 && (
            <div className="px-4 shrink-0">
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
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-5 px-5 py-2.5 border-b border-gray-200 shrink-0 bg-white">
          <StatPill label="Hoje"      value={stats.apptToday}   bg="bg-indigo-100"  color="text-indigo-700" />
          <StatPill label="7 dias"    value={stats.apptWeek}    bg="bg-violet-100"  color="text-violet-700" />
          <StatPill label="Pendentes" value={stats.apptPending} bg="bg-amber-100"   color="text-amber-700" />
        </div>
      )}

      {/* Calendar + detail panel */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          {selectedDay ? (
            <motion.div
              key="day"
              className="flex-1 flex flex-col overflow-hidden min-w-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <DayDetailView
                day={selectedDay}
                appointments={appointments}
                loading={loading}
                onBack={() => setSelectedDay(null)}
                onDayChange={handleDayChange}
                onAppointmentClick={setSelected}
                selectedId={selected?.id}
                onReschedule={canReschedule ? handleReschedule : undefined}
                onCreateRequest={canReschedule ? handleCreateRequest : undefined}
                canInteract={canReschedule}
              />
            </motion.div>
          ) : (
            <motion.div
              key="week"
              className="flex-1 flex flex-col overflow-hidden min-w-0"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <WeekCalendar
                appointments={appointments}
                weekStart={weekStart}
                loading={loading}
                onNavigate={setWeekStart}
                onAppointmentClick={setSelected}
                onDayClick={setSelectedDay}
                selectedId={selected?.id}
                onReschedule={canReschedule ? handleReschedule : undefined}
                onCreateRequest={canReschedule ? handleCreateRequest : undefined}
                canInteract={canReschedule}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="absolute right-0 top-0 h-full z-10"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 38, mass: 0.8 }}
            >
              <AppointmentDetailPanel
                appointment={selected}
                onClose={() => setSelected(null)}
                onUpdated={handleUpdated}
                canChangeStatus={canChangeStatus}
                canReschedule={canReschedule}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create-by-drag modal */}
      {newApptPrefill && dentistsForModalRef.current.length > 0 && (
        <NewAppointmentModal
          dentists={dentistsForModalRef.current}
          prefill={newApptPrefill}
          onClose={() => setNewApptPrefill(null)}
          onCreated={() => setNewApptPrefill(null)}
        />
      )}
    </div>
  );
}
