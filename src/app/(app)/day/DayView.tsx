"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
const PX_PER_MIN = SLOT_HEIGHT / 60;
const SNAP = 15; // minutes

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

function minsToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Snap a pixel Y within the column to a 15-min-aligned time
function yToTime(y: number) {
  const rawMins = (y / PX_PER_MIN) + CLINIC_START * 60;
  const snapped = Math.round(rawMins / SNAP) * SNAP;
  const clamped = Math.max(CLINIC_START * 60, Math.min(CLINIC_END * 60, snapped));
  return {
    minutes: clamped,
    hhmm: minsToHHMM(clamped),
    top: (clamped - CLINIC_START * 60) * PX_PER_MIN,
  };
}

type DayViewDrag =
  | {
      kind: "create";
      dentistId: string;
      anchorY: number; // snapped top px from column top
    }
  | {
      kind: "reschedule";
      apptId: string;
      dentistId: string;
      durationMins: number;
      grabOffsetY: number;
      startClientX: number;
      startClientY: number;
    };

type DayViewGhost = {
  kind: "create" | "reschedule";
  dentistId: string;
  top: number;
  height: number;
  startHHMM: string;
  endHHMM: string;
};

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
  }, [dateParam]);

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

  // --- Drag state ---
  const dragRef = useRef<DayViewDrag | null>(null);
  const ghostRef = useRef<DayViewGhost | null>(null);
  const [ghost, setGhostState] = useState<DayViewGhost | null>(null);
  const columnRefs = useRef(new Map<string, HTMLDivElement>());

  // Keep live values accessible from window event handlers
  const liveRef = useRef({ appointments, dentists, canCreate, dateParam });
  liveRef.current = { appointments, dentists, canCreate, dateParam };

  function setGhost(g: DayViewGhost | null) {
    ghostRef.current = g;
    setGhostState(g);
  }

  function getColumnY(dentistId: string, clientY: number): number {
    const el = columnRefs.current.get(dentistId);
    if (!el) return 0;
    return clientY - el.getBoundingClientRect().top;
  }

  function handleColumnMouseDown(e: React.MouseEvent, dentistId: string) {
    if (!canCreate) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-appt]")) return;
    e.preventDefault();

    const y = getColumnY(dentistId, e.clientY);
    const snapped = yToTime(y);

    dragRef.current = { kind: "create", dentistId, anchorY: snapped.top };
    setGhost({
      kind: "create",
      dentistId,
      top: snapped.top,
      height: SNAP * PX_PER_MIN,
      startHHMM: snapped.hhmm,
      endHHMM: minsToHHMM(snapped.minutes + SNAP),
    });

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }

  function handleApptMouseDown(e: React.MouseEvent, appt: AppointmentWithRelations) {
    if (!canCreate) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const apptTop = timeToY(appt.startTime);
    const apptEnd = timeToY(appt.endTime);
    const durationMins = (apptEnd - apptTop) / PX_PER_MIN;
    const grabOffsetY = getColumnY(appt.dentistId, e.clientY) - apptTop;

    dragRef.current = {
      kind: "reschedule",
      apptId: appt.id,
      dentistId: appt.dentistId,
      durationMins,
      grabOffsetY,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };

    setGhost({
      kind: "reschedule",
      dentistId: appt.dentistId,
      top: apptTop,
      height: durationMins * PX_PER_MIN,
      startHHMM: format(new Date(appt.startTime), "HH:mm"),
      endHHMM: format(new Date(appt.endTime), "HH:mm"),
    });

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const drag = dragRef.current;

      if (drag.kind === "create") {
        const y = getColumnY(drag.dentistId, e.clientY);
        const anchorMins = drag.anchorY / PX_PER_MIN + CLINIC_START * 60;
        const curMins = yToTime(y).minutes;
        const rawStart = Math.min(anchorMins, curMins);
        const rawEnd = Math.max(anchorMins, curMins);
        const snappedStart = Math.max(CLINIC_START * 60, Math.round(rawStart / SNAP) * SNAP);
        const snappedEnd = Math.min(CLINIC_END * 60, Math.max(Math.round(rawEnd / SNAP) * SNAP, snappedStart + SNAP));
        const newGhost: DayViewGhost = {
          kind: "create",
          dentistId: drag.dentistId,
          top: (snappedStart - CLINIC_START * 60) * PX_PER_MIN,
          height: Math.max((snappedEnd - snappedStart) * PX_PER_MIN, SNAP * PX_PER_MIN),
          startHHMM: minsToHHMM(snappedStart),
          endHHMM: minsToHHMM(snappedEnd),
        };
        ghostRef.current = newGhost;
        setGhostState(newGhost);

      } else {
        const y = getColumnY(drag.dentistId, e.clientY);
        const startTime = yToTime(y - drag.grabOffsetY);
        const endMins = Math.min(CLINIC_END * 60, startTime.minutes + drag.durationMins);
        const newGhost: DayViewGhost = {
          kind: "reschedule",
          dentistId: drag.dentistId,
          top: startTime.top,
          height: drag.durationMins * PX_PER_MIN,
          startHHMM: startTime.hhmm,
          endHHMM: minsToHHMM(endMins),
        };
        ghostRef.current = newGhost;
        setGhostState(newGhost);
      }
    }

    async function onUp(e: MouseEvent) {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const g = ghostRef.current;
      const { appointments, dateParam } = liveRef.current;

      if (drag.kind === "create" && g) {
        setNewApptPrefill({
          dentistId: drag.dentistId,
          date: dateParam,
          startTime: g.startHHMM,
          endTime: g.endHHMM,
        });
      } else if (drag.kind === "reschedule" && g) {
        const moved =
          Math.abs(e.clientX - drag.startClientX) > 6 ||
          Math.abs(e.clientY - drag.startClientY) > 6;

        if (!moved) {
          const appt = appointments.find((a) => a.id === drag.apptId);
          if (appt) setSelected(appt);
        } else {
          // Optimistic update then PATCH
          setAppointments((prev) =>
            prev.map((a) =>
              a.id !== drag.apptId
                ? a
                : {
                    ...a,
                    startTime: new Date(`1970-01-01T${g.startHHMM}:00`) as unknown as Date,
                    endTime: new Date(`1970-01-01T${g.endHHMM}:00`) as unknown as Date,
                  }
            )
          );
          try {
            const res = await fetch(`/api/appointments/${drag.apptId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ startTime: g.startHHMM, endTime: g.endHHMM }),
            });
            if (!res.ok) {
              fetchAppointments();
            } else {
              const updated: AppointmentWithRelations = await res.json();
              setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            }
          } catch {
            fetchAppointments();
          }
        }
      }

      dragRef.current = null;
      ghostRef.current = null;
      setGhostState(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [fetchAppointments]);

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
        <p className="text-xs text-gray-400">
          Clique e arraste em um horário vazio para criar um agendamento. Arraste um agendamento para reagendá-lo.
        </p>
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
              const isGhostColumn = ghost?.dentistId === dentist.id;

              return (
                <div key={dentist.id} className="flex-1 min-w-[160px] border-r border-gray-200 last:border-r-0">
                  <div className="h-10 border-b border-gray-200 flex items-center justify-center px-2">
                    <span className="text-xs font-medium text-gray-700 truncate text-center">
                      {dentist.user.name}
                    </span>
                  </div>

                  <div
                    ref={(el) => {
                      if (el) columnRefs.current.set(dentist.id, el);
                      else columnRefs.current.delete(dentist.id);
                    }}
                    className={`relative ${canCreate ? "cursor-cell" : ""}`}
                    style={{ height: TOTAL_HOURS * SLOT_HEIGHT }}
                    onMouseDown={(e) => handleColumnMouseDown(e, dentist.id)}
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

                    {/* Current-time indicator */}
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
                      const isBeingDragged =
                        ghost?.kind === "reschedule" && ghost.dentistId === dentist.id &&
                        dragRef.current?.kind === "reschedule" && dragRef.current.apptId === appt.id;

                      return (
                        <button
                          key={appt.id}
                          data-appt="true"
                          onMouseDown={canCreate ? (e) => handleApptMouseDown(e, appt) : undefined}
                          onClick={!canCreate ? (e) => { e.stopPropagation(); setSelected(appt); } : undefined}
                          className={`absolute left-1 right-1 rounded-md text-white text-left px-2 py-1 overflow-hidden ${colorClass} transition-all shadow-sm z-10 ${
                            canCreate ? "cursor-grab" : "cursor-pointer hover:brightness-110"
                          } ${isPast ? "opacity-50 grayscale" : ""} ${isBeingDragged ? "opacity-30" : ""}`}
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

                    {/* Reschedule ghost */}
                    {isGhostColumn && ghost?.kind === "reschedule" && (
                      <div
                        className="absolute left-1 right-1 z-30 pointer-events-none rounded-md border-l-[3px] border-l-indigo-400 bg-indigo-100/80 shadow-lg"
                        style={{ top: ghost.top, height: ghost.height }}
                      >
                        <p className="text-xs text-indigo-700 font-semibold px-1.5 pt-0.5 truncate">
                          {ghost.startHHMM} – {ghost.endHHMM}
                        </p>
                      </div>
                    )}

                    {/* Create ghost */}
                    {isGhostColumn && ghost?.kind === "create" && (
                      <div
                        className="absolute left-1 right-1 z-30 pointer-events-none rounded-md border border-dashed border-indigo-400 bg-indigo-50/80"
                        style={{ top: ghost.top, height: ghost.height }}
                      >
                        <p className="text-xs text-indigo-500 font-medium px-1.5 pt-0.5 truncate">
                          {ghost.startHHMM} – {ghost.endHHMM}
                        </p>
                      </div>
                    )}
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
