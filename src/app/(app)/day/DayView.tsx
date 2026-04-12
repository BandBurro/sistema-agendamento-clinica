"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useServerTime } from "@/hooks/useServerTime";
import { getAppointmentDateTime } from "@/lib/time";
import { useRouter, useSearchParams } from "next/navigation";
import { STATUS_BG_SOLID, STATUS_LABELS } from "@/types";
import type { AppointmentWithRelations, DentistWithUser } from "@/types";
import type { AppointmentStatus, Role } from "@/generated/prisma/client";
import { AppointmentModal } from "@/components/appointments/AppointmentModal";
import { NewAppointmentModal } from "@/components/appointments/NewAppointmentModal";

const CLINIC_START = 8;
const CLINIC_END = 18;
const TOTAL_HOURS = CLINIC_END - CLINIC_START;
const SLOT_HEIGHT = 60; // px per hour

interface NewApptPrefill {
  dentistId: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  dentists: DentistWithUser[];
  role: Role;
}

export function DayView({ dentists, role }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");

  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [newApptPrefill, setNewApptPrefill] = useState<NewApptPrefill | null>(null);

  const now = useServerTime();
  const isViewingToday = isToday(parseISO(dateParam));
  const nowY = (() => {
    const h = now.getUTCHours() + now.getUTCMinutes() / 60;
    return (h - CLINIC_START) * SLOT_HEIGHT;
  })();

  const canCreate = role === "ADMIN" || role === "RECEPTIONIST";
  const canChangeStatus = role !== "PATIENT";

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/appointments?date=${dateParam}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [dateParam, setLoading, setAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  function navigateDay(dir: 1 | -1) {
    const d = parseISO(dateParam);
    d.setDate(d.getDate() + dir);
    router.push(`/day?date=${format(d, "yyyy-MM-dd")}`);
  }

  function timeToY(time: Date): number {
    const d = new Date(time);
    const hours = d.getUTCHours() + d.getUTCMinutes() / 60;
    return (hours - CLINIC_START) * SLOT_HEIGHT;
  }

  function heightFor(start: Date, end: Date): number {
    const startD = new Date(start);
    const endD = new Date(end);
    const startH = startD.getUTCHours() + startD.getUTCMinutes() / 60;
    const endH = endD.getUTCHours() + endD.getUTCMinutes() / 60;
    return Math.max((endH - startH) * SLOT_HEIGHT, 20);
  }

  function handleSlotClick(dentistId: string, clickY: number) {
    if (!canCreate) return;
    // Snap to 30-min slots
    const rawHour = CLINIC_START + clickY / SLOT_HEIGHT;
    const snapped = Math.floor(rawHour * 2) / 2;
    const startH = Math.floor(snapped);
    const startM = snapped % 1 === 0.5 ? "30" : "00";
    const endSnapped = snapped + 1;
    const endH = Math.floor(endSnapped);
    const endM = endSnapped % 1 === 0.5 ? "30" : "00";

    if (startH >= CLINIC_END) return;

    setNewApptPrefill({
      dentistId,
      date: dateParam,
      startTime: `${String(startH).padStart(2, "0")}:${startM}`,
      endTime: `${String(Math.min(endH, CLINIC_END)).padStart(2, "0")}:${endM === "00" && endH === CLINIC_END ? "00" : endM}`,
    });
  }

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => CLINIC_START + i);

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateDay(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
          <h1 className="text-xl font-bold text-gray-900 capitalize">
            {format(parseISO(dateParam), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
          <button onClick={() => navigateDay(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">›</button>
        </div>
        <button
          onClick={() => router.push(`/day?date=${format(new Date(), "yyyy-MM-dd")}`)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Hoje
        </button>
      </div>

      {canCreate && (
        <p className="text-xs text-gray-400">Clique em um horário vazio para criar um agendamento.</p>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
        ) : (
          <div className="flex">
            {/* Time axis */}
            <div className="w-14 shrink-0 border-r border-gray-200">
              <div className="h-10 border-b border-gray-200" />
              {hours.map((h) => (
                <div key={h} className="relative" style={{ height: SLOT_HEIGHT }}>
                  <span className="absolute -top-2.5 right-2 text-xs text-gray-400">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Dentist columns */}
            {dentists.map((dentist) => {
              const dentistAppts = appointments.filter((a) => a.dentistId === dentist.id);

              return (
                <div key={dentist.id} className="flex-1 min-w-[160px] border-r border-gray-200 last:border-r-0">
                  <div className="h-10 border-b border-gray-200 flex items-center justify-center px-2">
                    <span className="text-xs font-medium text-gray-700 truncate text-center">
                      {dentist.user.name}
                    </span>
                  </div>

                  {/* Time grid — clickable for empty slots */}
                  <div
                    className={`relative ${canCreate ? "cursor-pointer" : ""}`}
                    style={{ height: TOTAL_HOURS * SLOT_HEIGHT }}
                    onClick={(e) => {
                      // Only fire if clicking the column background, not an appointment block
                      if ((e.target as HTMLElement).closest("button[data-appt]")) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSlotClick(dentist.id, e.clientY - rect.top);
                    }}
                  >
                    {/* Hour lines */}
                    {hours.map((h, idx) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-gray-200 pointer-events-none"
                        style={{ top: idx * SLOT_HEIGHT }}
                      />
                    ))}

                    {/* Half-hour lines */}
                    {hours.slice(0, -1).map((h, idx) => (
                      <div
                        key={`half-${h}`}
                        className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
                        style={{ top: idx * SLOT_HEIGHT + SLOT_HEIGHT / 2 }}
                      />
                    ))}

                    {/* Current-time indicator — today only */}
                    {isViewingToday && nowY >= 0 && nowY <= TOTAL_HOURS * SLOT_HEIGHT && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: nowY }}
                      >
                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <div className="flex-1 border-t-2 border-rose-500" />
                      </div>
                    )}

                    {/* Appointment blocks */}
                    {dentistAppts.map((appt) => {
                      const top = timeToY(appt.startTime);
                      const height = heightFor(appt.startTime, appt.endTime);
                      const colorClass = STATUS_BG_SOLID[appt.status as AppointmentStatus];
                      const isPast = getAppointmentDateTime(appt.date, appt.startTime) < now;

                      return (
                        <button
                          key={appt.id}
                          data-appt="true"
                          onClick={(e) => { e.stopPropagation(); setSelected(appt); }}
                          className={`absolute left-1 right-1 rounded-md text-white text-left px-2 py-1 overflow-hidden ${colorClass} hover:brightness-110 transition-all shadow-sm z-10 ${isPast ? "opacity-50 grayscale" : ""}`}
                          style={{ top, height: Math.max(height - 2, 18) }}
                          title={`${appt.patient.user.name} — ${STATUS_LABELS[appt.status as AppointmentStatus]}`}
                        >
                          <p className="text-xs font-medium truncate">{appt.patient.user.name}</p>
                          {height > 30 && (
                            <p className="text-xs opacity-80 truncate">
                              {format(new Date(appt.startTime), "HH:mm")}–{format(new Date(appt.endTime), "HH:mm")}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {dentists.length === 0 && (
              <div className="flex-1 flex items-center justify-center h-64 text-gray-400 text-sm">
                Nenhum dentista encontrado.
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelected(null);
          }}
          canChangeStatus={canChangeStatus}
          canReschedule={canCreate}
        />
      )}

      {newApptPrefill && (
        <NewAppointmentModal
          dentists={dentists}
          prefill={newApptPrefill}
          onClose={() => setNewApptPrefill(null)}
          onCreated={fetchAppointments}
        />
      )}
    </div>
  );
}
